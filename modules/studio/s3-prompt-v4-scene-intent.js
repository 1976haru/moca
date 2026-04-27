/* ================================================
   modules/studio/s3-prompt-v4-scene-intent.js
   ⭐ v4 — 씬 단위 의도 분석 + 증거 추출
   * window.analyzeSceneIntentV4(scene, projectProfile, sceneIndex, allScenes)
       → {
           sceneIndex, role, startSec, endSec, summary,
           narrativeGoal, visualGoal, keyMessage,
           subject, subjectCount, age, gender, ethnicity, relationship,
           mustShowObjects[], mustShowActions[], mustShowEmotion[],
           mustShowEnvironment[], location, timeOfDay, wardrobe,
           continuityAnchor, cameraPriority, motionPriority, avoidList[],
           evidenceText, role
         }
   * window.analyzeAllSceneIntentsV4(projectProfile)
       → 모든 씬을 순서대로 분석 + differentiation hint 누적
   * 결정적 (rule-based, AI 호출 없음).
   * 한국어/일본어 대본 모두 지원.
   ================================================ */
(function(){
  'use strict';

  function _has(re, s){ return re.test(String(s||'')); }
  function _coerce(v){ return v == null ? '' : String(v); }

  /* ════════════════════════════════════════════════
     role 결정 — sceneIndex / total / explicit role
     ════════════════════════════════════════════════ */
  function _resolveRole(scene, sceneIndex, total){
    var explicit = String((scene && (scene.role || scene.roleHint || '')) || '').toLowerCase().trim();
    if (explicit) {
      if (/hook/.test(explicit))                    return 'hook';
      if (/setup|intro|explain|detail/.test(explicit)) return 'setup';
      if (/conflict|core|main|develop|cause/.test(explicit)) return 'conflict_or_core';
      if (/reveal|solution|resolve|insight|payoff/.test(explicit)) return 'reveal_or_solution';
      if (/cta|outro|summary|conclusion/.test(explicit)) return 'cta';
      return explicit;
    }
    if (sceneIndex === 0)                  return 'hook';
    if (sceneIndex === total - 1)          return 'cta';
    if (sceneIndex === 1)                  return 'setup';
    if (sceneIndex === total - 2)          return 'reveal_or_solution';
    return 'conflict_or_core';
  }

  /* ════════════════════════════════════════════════
     evidence 추출 — 광범위 카테고리
     mustShowObjects / mustShowActions / mustShowEmotion / mustShowEnvironment
     ════════════════════════════════════════════════ */
  var OBJECT_RULES = [
    /* 신체 부위 */
    { re:/무릎|knee|膝/i,                              show:'knee' },
    { re:/허리|등|back\b|腰/i,                         show:'lower back' },
    { re:/어깨|shoulder|肩/i,                           show:'shoulder' },
    { re:/발목|ankle|足首/i,                            show:'ankle' },
    { re:/손목|wrist|手首/i,                            show:'wrist' },
    { re:/다리|leg|脚/i,                                show:'leg' },
    { re:/발(?!목)|foot/i,                              show:'foot' },
    { re:/얼굴|face\b|顔/i,                             show:'face' },
    { re:/눈\s|눈물|tear|涙/i,                          show:'eyes with subtle expression' },
    { re:/손\s|손바닥|palm|手のひら/i,                  show:'open hand' },
    /* 의료/건강 소품 */
    { re:/혈압계|blood pressure|血圧計/i,               show:'home blood pressure monitor' },
    { re:/체중계|scale|체중|体重計/i,                   show:'digital body weight scale' },
    { re:/약(?:봉지|병|상자)?|pills?|medication|薬/i,  show:'medication packet on table' },
    { re:/처방전|prescription/i,                       show:'prescription paper' },
    { re:/온찜질|찜질팩|핫팩|heat pack|온열/i,           show:'warm heat pack' },
    { re:/안경|眼鏡|glasses\b/i,                        show:'reading glasses' },
    { re:/마스크|mask\b|マスク/i,                       show:'face mask' },
    { re:/지팡이|cane|杖/i,                             show:'walking cane' },
    { re:/휠체어|wheelchair/i,                          show:'wheelchair' },
    /* 일상 사물 */
    { re:/휴대폰|핸드폰|phone|スマホ|電話/i,             show:'smartphone in hand' },
    { re:/카메라|camera|カメラ/i,                       show:'camera' },
    { re:/지갑|wallet|財布/i,                            show:'wallet' },
    { re:/가방|bag\b|カバン/i,                           show:'shoulder bag' },
    { re:/책\b|book\b|本\b/i,                            show:'book on table' },
    { re:/편지|letter|手紙/i,                           show:'handwritten letter' },
    { re:/사진(?:첩|앨범)?|photo|アルバム|写真/i,       show:'old framed family photograph' },
    { re:/계약서|contract|契約/i,                       show:'contract paper' },
    { re:/저장 ?버튼|save button/i,                    show:'phone screen with save button' },
    { re:/카드(?:번호|뉴스)?|credit card/i,             show:'credit card' },
    { re:/거울|mirror|鏡/i,                              show:'mirror' },
    /* 음식/주방 */
    { re:/커피잔|coffee cup/i,                         show:'coffee cup' },
    { re:/찻잔|teacup|湯飲み/i,                          show:'tea cup' },
    { re:/밥(?:상|그릇)?|rice bowl/i,                  show:'rice bowl' },
    { re:/김치|kimchi/i,                                show:'kimchi banchan' },
    { re:/도시락|bento|お弁当/i,                        show:'bento lunchbox' },
    { re:/라면|ramen|ラーメン/i,                        show:'ramen bowl' },
    { re:/케이크|cake|ケーキ/i,                         show:'cake on plate' },
    /* 신발/의류 */
    { re:/운동화|sneakers|スニーカー/i,                 show:'sneakers' },
    { re:/신발|shoe|靴/i,                               show:'pair of shoes' },
    /* 운동/건강 */
    { re:/스트레칭|stretch/i,                           show:'stretching motion' },
    { re:/요가매트|매트|yoga mat/i,                     show:'yoga mat' },
    { re:/물병|water bottle/i,                          show:'water bottle' },
    { re:/타월|수건|towel/i,                            show:'towel' },
    { re:/덤벨|dumbbell|ダンベル/i,                     show:'small dumbbell' },
    /* 환경 소품 */
    { re:/계단|stairs|階段/i,                           show:'staircase' },
    { re:/난간|handrail|手すり/i,                       show:'handrail' },
    { re:/엘리베이터|elevator|エレベーター/i,           show:'elevator door' },
    { re:/경사로|램프|ramp/i,                           show:'accessibility ramp' },
    { re:/의자|chair|椅子/i,                            show:'sturdy chair' },
    { re:/식탁|dining|食卓/i,                           show:'wooden dining table' },
    /* 정보/문서 */
    { re:/서류|신청서|application/i,                    show:'application form on desk' },
    { re:/통장|bankbook|通帳/i,                         show:'bankbook' },
    { re:/달력|calendar|カレンダー/i,                   show:'wall calendar' },
    /* 비즈니스 */
    { re:/매장|가게|상점|お店/i,                         show:'small neighborhood shop interior' },
    { re:/제품|상품|商品/i,                             show:'the featured product' },

    /* ── 음식 비교 (한국 vs 일본 등) ── */
    { re:/김치찌개|kimchi stew/i,                        show:'bubbling kimchi stew pot' },
    { re:/된장찌개|doenjang/i,                            show:'doenjang stew' },
    { re:/부대찌개|budae jjigae/i,                       show:'budae jjigae pot' },
    { re:/비빔밥|bibimbap/i,                             show:'colorful bibimbap bowl' },
    { re:/불고기|bulgogi/i,                              show:'bulgogi grilling on plate' },
    { re:/삼겹살|samgyeopsal/i,                          show:'samgyeopsal on grill' },
    { re:/떡볶이|tteokbokki/i,                           show:'spicy tteokbokki' },
    { re:/막걸리|makgeolli/i,                            show:'makgeolli bowl' },
    { re:/스시|sushi|寿司/i,                             show:'sushi platter' },
    { re:/우동|udon|うどん/i,                            show:'udon bowl' },
    { re:/소바|soba|そば/i,                              show:'soba in bamboo basket' },
    { re:/덴푸라|tempura|天ぷら/i,                       show:'tempura plate' },
    { re:/규동|gyudon|牛丼/i,                            show:'gyudon beef bowl' },
    { re:/오니기리|onigiri|おにぎり/i,                   show:'onigiri rice ball' },
    { re:/츠케멘|tsukemen|つけ麺/i,                      show:'tsukemen dipping noodle' },
    { re:/낫토|natto|納豆/i,                             show:'natto bowl' },
    { re:/미소국|miso soup|味噌汁/i,                     show:'miso soup bowl' },
    { re:/젓가락|chopsticks|箸/i,                        show:'chopsticks' },
    { re:/숟가락|spoon|スプーン/i,                       show:'spoon' },
    { re:/포크|fork|フォーク/i,                          show:'fork' },
    { re:/접시|plate|皿/i,                               show:'ceramic plate' },

    /* ── 동물·반려·애니메이션 캐릭터 ── */
    { re:/강아지|puppy|dog\b|犬/i,                       show:'small friendly dog character' },
    { re:/고양이|cat\b|猫/i,                             show:'fluffy cat character' },
    { re:/토끼|rabbit|うさぎ/i,                          show:'cute rabbit character' },
    { re:/곰|bear\b|くま/i,                              show:'gentle bear character' },
    { re:/햄스터|hamster/i,                              show:'tiny hamster' },
    { re:/앵무새|parrot|オウム/i,                        show:'colorful parrot' },
    { re:/꼬리|tail|しっぽ/i,                            show:'wagging tail' },
    { re:/털|fur|毛/i,                                   show:'soft fur texture' },
    { re:/발바닥|paw|肉球/i,                             show:'paw close-up' },
    { re:/귀\b|ear\b|耳/i,                               show:'perked ears' },
    { re:/공\b|ball|ボール/i,                            show:'tennis ball or play ball' },
    { re:/사료|kibble|餌/i,                              show:'pet food bowl' },
    { re:/목줄|leash|リード/i,                           show:'pet leash' },
    { re:/쥐\b|mouse toy|ねずみ/i,                       show:'small toy mouse' },
    { re:/장난감|toy|おもちゃ/i,                         show:'pet toy' },

    /* ── 명언/인생조언 — 상징적 사물 ── */
    { re:/촛불|candle|ろうそく/i,                        show:'single lit candle' },
    { re:/창문|window|窓/i,                              show:'soft daylight window' },
    { re:/시계|clock|時計/i,                             show:'wall clock' },
    { re:/모래시계|hourglass|砂時計/i,                   show:'hourglass with falling sand' },
    { re:/문\b|door\b|ドア|扉/i,                         show:'wooden door' },
    { re:/길\b|path\b|道/i,                              show:'long winding path' },
    { re:/열쇠|key\b|鍵/i,                               show:'small key on a ring' },
    { re:/등불|lantern|提灯/i,                           show:'paper lantern with warm glow' },
    { re:/나뭇잎|leaf\b|葉/i,                            show:'single leaf catching light' },
    { re:/그림자|shadow|影/i,                            show:'soft shadow on wall' },
    { re:/계단(?:참|새)?|step on path/i,                 show:'stone step' },
    { re:/돌(?:멩이)?|stone\b|石/i,                      show:'smooth stone' },

    /* ── 코믹/티키타카 — 표정·소품 대비 ── */
    { re:/안경테|frame glasses|メガネ/i,                 show:'oversized comedic glasses' },
    { re:/포인터|pointer stick|指し棒/i,                 show:'comedic pointer stick' },
    { re:/메모지|sticky note|付箋/i,                     show:'colored sticky note in hand' },
    { re:/풍선|balloon|風船/i,                           show:'small bright balloon' },

    /* ── 관계/가족 ── */
    { re:/반지|ring\b|指輪/i,                            show:'wedding ring' },
    { re:/꽃다발|bouquet|花束/i,                         show:'small flower bouquet' },
    { re:/포옹|embrace|抱擁/i,                           show:'warm embrace gesture' },
    { re:/유산|inheritance|遺産/i,                       show:'old document on table' },
    { re:/유언장|will\b|遺言/i,                          show:'handwritten will paper' },
    { re:/육아|parenting|育児/i,                         show:'childcare scene cue' },
    { re:/학교 ?가방|school bag|ランドセル/i,            show:'school backpack' },

    /* ── 제품/리뷰 ── */
    { re:/박스|상자|box\b|箱/i,                          show:'product box on table' },
    { re:/포장|package|包装/i,                           show:'package wrapping' },
    { re:/리모컨|remote control|リモコン/i,              show:'remote control' },
    { re:/이어폰|earphone|イヤホン/i,                    show:'wireless earbuds' },
    { re:/충전기|charger|充電器/i,                       show:'charging cable plugged in' },
    { re:/노트북|laptop|ノートPC/i,                      show:'open laptop' },
    { re:/태블릿|tablet|タブレット/i,                    show:'tablet screen' },

    /* ── 소상공인 홍보 ── */
    { re:/간판|signboard|看板/i,                         show:'small shop signboard' },
    { re:/메뉴(?:판|판)?|menu board|メニュー/i,          show:'wall menu board' },
    { re:/영수증|receipt|レシート/i,                     show:'paper receipt' },
    { re:/주방|kitchen counter|厨房/i,                   show:'small shop kitchen counter' },
    { re:/포스(?:기|단말)|POS/i,                         show:'POS machine' },
    { re:/택배|delivery box|配達/i,                      show:'delivery package at door' },
    { re:/유니폼|uniform|制服/i,                         show:'staff uniform apron' },
    { re:/명함|business card|名刺/i,                     show:'business card on table' },
    { re:/오픈\s*사인|open sign|営業中/i,                show:'open sign on door' },
  ];

  var ACTION_RULES = [
    { re:/걷|walk(?:ing)?|歩/i,                                 show:'walking' },
    { re:/뛰|run(?:ning)?|走/i,                                 show:'running' },
    { re:/앉|sit(?:ting)?|座/i,                                 show:'sitting' },
    { re:/서있|standing|立/i,                                   show:'standing' },
    { re:/누워|lying down|寝て/i,                               show:'lying down' },
    { re:/먹|eat(?:ing)?|食べ/i,                                show:'eating' },
    { re:/마시|drink(?:ing)?|飲/i,                              show:'drinking' },
    { re:/잡|holding|握/i,                                      show:'holding the object' },
    { re:/들어올|lift(?:ing)?|持ち上げ/i,                       show:'lifting' },
    { re:/내려놓|placing down|置/i,                             show:'placing down carefully' },
    { re:/누르|press(?:ing)?|押/i,                              show:'pressing the button' },
    { re:/쓰|write?(?:ing)?|書/i,                               show:'writing' },
    { re:/보(?:다|며)|look(?:ing)?|見/i,                        show:'looking attentively' },
    { re:/듣|listen(?:ing)?|聞/i,                               show:'listening' },
    { re:/말|speak(?:ing)?|喋|話/i,                             show:'speaking gently' },
    { re:/안(?:다|아)|hug(?:ging)?|抱/i,                        show:'hugging' },
    { re:/웃|smile|笑/i,                                        show:'smiling' },
    { re:/울|cry(?:ing)?|泣/i,                                  show:'crying softly' },
    { re:/놀라|surprised|驚/i,                                  show:'reacting in surprise' },
    { re:/지목|point(?:ing)?|指/i,                              show:'pointing' },
    { re:/끄덕|nod(?:ding)?|うなず/i,                           show:'nodding' },
    { re:/손\s*흔|wave|手を振/i,                                show:'waving' },
    { re:/계단(?:을|을 )?오르|climb stairs|階段を上が/i,         show:'climbing stairs carefully' },
    { re:/체중(?:을|을 )?재|step on the scale|体重を計/i,        show:'stepping on the scale' },
    { re:/혈압(?:을|을 )?재|measure blood pressure|血圧を測/i,  show:'measuring blood pressure' },
    { re:/(?:전화|폰)(?:을|를 )?받|answer (?:the )?phone|電話に出/i, show:'answering the phone' },
    { re:/사진(?:을|을 )?(?:보|찍)|take a photo|写真を/i,        show:'looking at a photograph' },
    { re:/저장(?:을|을 )?(?:누|하)|tap save/i,                   show:'tapping the save button' },

    /* ── 코믹/티키타카 동작 ── */
    { re:/티격태격|bickering|揉め/i,                              show:'lively back-and-forth bickering' },
    { re:/우기|insisting|主張/i,                                  show:'insisting with confidence' },
    { re:/반박|countering|反論/i,                                 show:'countering the argument' },
    { re:/장난|teasing|からかう/i,                                show:'playful teasing gesture' },
    { re:/엄지|thumbs up|親指/i,                                  show:'thumbs up' },
    { re:/박수|clap|拍手/i,                                       show:'clapping hands' },
    { re:/하이파이브|high[- ]?five/i,                             show:'high-five gesture' },
    { re:/어이없|stunned|呆れ/i,                                  show:'stunned reaction with wide eyes' },
    { re:/뜨악|gobsmacked/i,                                      show:'gobsmacked freeze' },
    { re:/들이밀|thrust forward|突き出/i,                         show:'thrusting object forward' },
    { re:/모으|gathering|集め/i,                                  show:'gathering items toward center' },
    { re:/가리키며 ?웃|laugh while pointing/i,                    show:'laughing while pointing' },

    /* ── 동물 모션 ── */
    { re:/꼬리(?:를|를 )?(?:흔|치)|wag (?:the )?tail|しっぽを振/i, show:'wagging tail energetically' },
    { re:/짖|bark|吠/i,                                           show:'barking softly' },
    { re:/야옹|meow|ニャー/i,                                     show:'meowing' },
    { re:/뛰어 ?오르|leap up|跳ね/i,                              show:'leaping up playfully' },
    { re:/달려 ?가|run toward|駆け/i,                             show:'running toward camera' },
    { re:/쫓|chase|追/i,                                          show:'chasing the toy' },
    { re:/킁킁|sniff|嗅ぎ/i,                                      show:'sniffing curiously' },
    { re:/핥|lick|舐/i,                                           show:'gentle licking' },
    { re:/머리 ?기울|head tilt|首をかしげ/i,                      show:'cute head tilt' },
    { re:/구르|roll over|転が/i,                                  show:'rolling over playfully' },
    { re:/기지개|stretch out|背伸び/i,                            show:'stretching out paws' },
    { re:/발 ?을 ?올|paw up|手を乗せ/i,                           show:'placing paw on owner hand' },
    { re:/잠 ?에서 ?깨|wake up|目覚め/i,                          show:'waking up with a yawn' },

    /* ── 명언/인생조언 모션 ── */
    { re:/촛불 ?끄|blow out candle/i,                             show:'gently blowing out a candle' },
    { re:/창 ?밖(?:을|을 )?(?:바라|보)|look out the window/i,     show:'looking out a sunlit window' },
    { re:/문(?:을|을 )?열|opening the door/i,                     show:'slowly opening a wooden door' },
    { re:/길(?:을|을 )?걸|walking the path/i,                     show:'walking down a quiet path' },
    { re:/열쇠(?:를|를 )?돌|turning the key/i,                    show:'turning a key in a lock' },
    { re:/돌(?:멩이)?(?:를|를 )?잡|holding a stone/i,             show:'holding a smooth stone' },
    { re:/내려놓는|setting down|置き/i,                           show:'setting an object down with care' },

    /* ── 음식 비교 모션 ── */
    { re:/그릇(?:을|을 )?내려놓|setting down a bowl/i,            show:'placing a bowl on the table' },
    { re:/숟가락(?:을|을 )?들|lifting the spoon/i,                show:'lifting a spoon to mouth' },
    { re:/젓가락(?:을|을 )?들|chopsticks lifting/i,               show:'lifting food with chopsticks' },
    { re:/한 ?입|taking a bite|一口/i,                            show:'taking the first bite' },
    { re:/김(?:이)? ?나|steam rising|湯気/i,                      show:'steam rising from the bowl' },

    /* ── 관계/가족 모션 ── */
    { re:/손(?:을|을 )?잡|holding hands|手を繋/i,                 show:'holding hands gently' },
    { re:/안아 ?주|wrapping in a hug/i,                           show:'wrapping in a warm hug' },
    { re:/입맞춤|kiss on cheek|キス/i,                            show:'gentle kiss on the cheek' },
    { re:/머리(?:를|를 )?쓰다듬|patting the head/i,               show:'patting the head softly' },
    { re:/같이 ?걷|walking together|一緒に歩/i,                   show:'walking side by side' },

    /* ── 제품/리뷰 모션 ── */
    { re:/박스(?:를|를 )?(?:열|뜯)|opening the box/i,             show:'opening the product box' },
    { re:/제품(?:을|을 )?돌|rotating the product/i,               show:'rotating the product to camera' },
    { re:/버튼(?:을|을 )?누|pressing the product button/i,        show:'pressing the product button' },
    { re:/충전(?:기?를|기?를 )?꽂|plugging in the charger/i,      show:'plugging in the charger' },
    { re:/포장(?:을|을 )?뜯|tearing the package/i,                show:'unboxing wrapper' },

    /* ── 소상공인 모션 ── */
    { re:/간판(?:을|을 )?거|hanging the signboard/i,              show:'hanging the shop sign' },
    { re:/오픈|opening shop|開店/i,                               show:'flipping the open sign' },
    { re:/계산|checkout|会計/i,                                   show:'ringing up at the register' },
    { re:/배달|deliver|配達/i,                                    show:'handing the delivery package' },
    { re:/고객(?:과|과 )?대화|talking with customer/i,            show:'talking warmly with a customer' },
    { re:/메뉴(?:를|를 )?설명|explaining the menu/i,              show:'explaining the menu' },
    { re:/제품(?:을|을 )?소개|introducing the product/i,          show:'introducing the product to camera' },
  ];

  var EMOTION_RULES = [
    { re:/후회|미안|残念|悔/i,            show:'restrained regret' },
    { re:/감사|고마|感謝|ありがと/i,       show:'quiet gratitude' },
    { re:/외로|寂し|ひとり/i,              show:'gentle loneliness' },
    { re:/기쁨|행복|嬉|幸せ/i,             show:'soft contentment' },
    { re:/걱정|불안|心配|不安|두려/i,      show:'composed concern' },
    { re:/놀란|surprised|びっくり/i,       show:'genuine surprise' },
    { re:/안도|relief|ほっと/i,            show:'visible relief' },
    { re:/단호|결심|determined/i,          show:'quiet determination' },
    { re:/통증|아프|痛/i,                  show:'mild discomfort, not pain horror' },
    { re:/그리움|미련|懐かし/i,            show:'wistful longing' },
    { re:/충격|shock|ショック/i,           show:'subtle shock' },
    { re:/민망|쑥스|恥/i,                  show:'shy embarrassment' },
    { re:/자신감|confident|自信/i,         show:'quiet confidence' },
    /* 코믹 */
    { re:/어이없|呆れ|stunned/i,           show:'stunned comedic disbelief' },
    { re:/대박|amazing/i,                  show:'wide-eyed astonishment' },
    { re:/꼬소|smug|得意/i,                show:'smug grin' },
    { re:/뻘쭘|awkward|ばつが悪/i,         show:'awkward pause expression' },
    { re:/궁시렁|grumbling|ぶつぶつ/i,     show:'grumbling under breath' },
    { re:/박장대소|bursting laugh/i,       show:'bursting into laughter' },
    /* 명언 */
    { re:/평온|calm|穏やか/i,              show:'reflective calm' },
    { re:/사색|pondering|思案/i,           show:'soft pondering gaze' },
    { re:/허무|emptiness/i,                show:'sober emptiness' },
    { re:/희망|hope|希望/i,                show:'subtle hope' },
    /* 동물 */
    { re:/신남|excited|興奮/i,             show:'playful excitement' },
    { re:/호기심|curious|好奇/i,           show:'pure curiosity' },
    /* 관계/가족 */
    { re:/애정|affection|愛情/i,           show:'tender affection' },
    { re:/지지|support|支え/i,             show:'silent supportive presence' },
    /* 제품 리뷰 */
    { re:/만족|satisfied|満足/i,           show:'satisfied nod' },
    { re:/기대|anticipation|期待/i,        show:'building anticipation' },
  ];

  var ENV_RULES = [
    { re:/집|거실|방|식탁|家|リビング/i,                    show:'warm home interior' },
    { re:/부엌|kitchen|台所/i,                              show:'home kitchen' },
    { re:/병원|진료|병실|病院|診察/i,                       show:'quiet hospital corridor' },
    { re:/공원|公園|park\b/i,                              show:'quiet neighborhood park' },
    { re:/길|골목|거리|路地|道/i,                           show:'narrow neighborhood street' },
    { re:/사무실|회사|オフィス|office/i,                    show:'small office' },
    { re:/매장|가게|상점|お店/i,                            show:'small neighborhood shop' },
    { re:/카페|cafe|喫茶/i,                                show:'cozy cafe' },
    { re:/관공서|구청|市役所|public office/i,               show:'public service office' },
    { re:/시장|market|市場/i,                              show:'traditional market' },
    { re:/학교|school|学校/i,                              show:'small classroom' },
    { re:/지하철|subway|電車|train/i,                       show:'subway car interior' },
    { re:/마당|backyard|庭/i,                              show:'home backyard' },
    { re:/계단/i,                                          show:'indoor staircase' },
    { re:/베란다|veranda|ベランダ/i,                       show:'apartment veranda' },
    /* 음식점/카페/시장 */
    { re:/식당|restaurant|レストラン|食堂/i,                show:'small cozy restaurant interior' },
    { re:/포장마차|street food cart|屋台/i,                 show:'lively street food cart' },
    { re:/술집|izakaya|居酒屋/i,                            show:'warm izakaya interior' },
    { re:/도서관|library|図書館/i,                          show:'quiet library' },
    /* 자연/명언 배경 */
    { re:/하늘|sky|空/i,                                    show:'soft sky background' },
    { re:/바다|sea|海/i,                                    show:'calm sea horizon' },
    { re:/산\b|mountain|山/i,                              show:'distant mountain silhouette' },
    { re:/숲|forest|森/i,                                   show:'soft sunlit forest' },
    { re:/들판|field|野原/i,                                show:'open quiet field' },
    /* 동물/반려 */
    { re:/반려동물 ?거실|pet room|ペットルーム/i,           show:'pet-friendly home corner' },
    { re:/마당 ?잔디|backyard grass|庭の芝生/i,             show:'sunny backyard grass' },
    /* 소상공인/제품 */
    { re:/스튜디오|studio|スタジオ/i,                       show:'small product photo studio' },
    { re:/창고|warehouse|倉庫/i,                            show:'small storage room' },
    { re:/카운터|counter|カウンター/i,                      show:'shop counter' },
  ];

  var TIME_RULES = [
    { re:/새벽|dawn|早朝/i,             show:'early dawn' },
    { re:/아침|morning|朝/i,            show:'morning' },
    { re:/점심|noon|昼/i,               show:'midday' },
    { re:/오후|afternoon|午後/i,        show:'afternoon' },
    { re:/저녁|evening|夕方/i,          show:'evening' },
    { re:/밤|night|夜/i,                show:'night' },
  ];

  function _extractAll(rules, text){
    var t = String(text || '').toLowerCase();
    var seen = {}, out = [];
    rules.forEach(function(r){
      if (r.re.test(t) && !seen[r.show]) {
        seen[r.show] = true;
        out.push(r.show);
      }
    });
    return out;
  }

  /* ════════════════════════════════════════════════
     subject / count / relationship
     ════════════════════════════════════════════════ */
  function _detectSubjectCount(text){
    var t = String(text || '');
    if (/세 ?사람|three people|3 ?인|3人/i.test(t))                   return 3;
    if (/네 ?사람|four people|4 ?인|4人/i.test(t))                   return 4;
    if (/두 ?사람|두명|2명|two people|couple|부부|夫婦/i.test(t))      return 2;
    if (/혼자|alone|ひとり|독신/i.test(t))                            return 1;
    if (/(^|\n)\s*[AB][:：]/.test(t))                                  return 2;
    return 0;
  }
  function _detectRelationship(text){
    if (/부부|夫婦|married couple/.test(text))      return 'married couple';
    if (/모자|어머니와 아들/.test(text))             return 'mother and son';
    if (/모녀|어머니와 딸/.test(text))               return 'mother and daughter';
    if (/부녀|아버지와 딸/.test(text))               return 'father and daughter';
    if (/부자|아버지와 아들/.test(text))             return 'father and son';
    if (/할머니와 손주|grandma and grandchild/.test(text)) return 'grandmother and grandchild';
    if (/할아버지와 손주|grandpa and grandchild/.test(text)) return 'grandfather and grandchild';
    if (/친구|friends?|友達/.test(text))             return 'close friends';
    if (/이웃|neighbor|隣人/.test(text))             return 'neighbors';
    if (/의사와 환자|doctor.*patient/.test(text))    return 'doctor and patient';
    return '';
  }
  function _detectAge(text, projectProfile){
    if (/8\d ?대|80s|80代/.test(text))                     return 'in their 80s';
    if (/7\d ?대|70s|70代/.test(text))                     return 'in their 70s';
    if (/6\d ?대|60s|60代/.test(text))                     return 'in their 60s';
    if (/5\d ?대|50s|50代/.test(text))                     return 'in their 50s';
    if (/4\d ?대|40s|40代/.test(text))                     return 'in their 40s';
    if (/3\d ?대|30s|30代/.test(text))                     return 'in their 30s';
    if (/2\d ?대|20s|20代/.test(text))                     return 'in their 20s';
    if (projectProfile && projectProfile.audience === 'korean_senior') return 'in their 60s or 70s';
    if (projectProfile && projectProfile.audience === 'japanese_senior') return 'in their 60s or 70s';
    return '';
  }
  function _detectGender(text){
    var male = /(?:할아버지|아버지|아빠|아저씨|남자|남성|男性|お父さん|おじい)/i.test(text);
    var female = /(?:할머니|어머니|엄마|아주머니|여자|여성|女性|お母さん|おばあ)/i.test(text);
    if (male && !female) return 'male';
    if (female && !male) return 'female';
    if (male && female)  return 'mixed';
    return '';
  }

  function _decideSubject(text, projectProfile, subjectCount, relationship){
    var topic = (projectProfile && projectProfile.topic) || '';
    var combined = (text + ' ' + topic).toLowerCase();

    /* 동물/3D 모드는 사람 자동 삽입 금지 */
    if (projectProfile && projectProfile.visualWorldType === 'animal_character') {
      if (/강아지|dog|犬/.test(combined))   return 'a friendly cartoon-style dog character';
      if (/고양이|cat|猫/.test(combined))   return 'a friendly cartoon-style cat character';
      if (/토끼|rabbit|うさぎ/.test(combined)) return 'a friendly cartoon-style rabbit character';
      return 'a friendly small animal character';
    }
    if (projectProfile && projectProfile.visualWorldType === '3d_character') {
      return 'stylized 3D character of the topic subject';
    }
    if (projectProfile && projectProfile.visualWorldType === 'emoji') {
      return 'iconic flat-vector subject of the topic subject';
    }

    /* 관계가 명시된 경우 */
    if (relationship) return relationship;

    /* 시니어 청중 */
    var aud = projectProfile && projectProfile.audience;
    var ethnicityHint = '';
    if (aud === 'korean_senior')   ethnicityHint = 'Korean ';
    if (aud === 'japanese_senior') ethnicityHint = 'Japanese ';

    if (/할머니|おばあ/.test(combined))  return ethnicityHint + 'elderly woman in her 70s';
    if (/할아버지|おじい/.test(combined)) return ethnicityHint + 'elderly man in his 70s';
    if (/시니어|어르신|高齢|シニア/.test(combined)) return ethnicityHint + 'senior in their 60s or 70s';
    if (subjectCount === 2 && /부부|夫婦/.test(combined)) return ethnicityHint + 'married senior couple';
    if (/사장|점주|owner|店長/.test(combined)) return ethnicityHint + 'small business owner';
    if (/학생|아이|kid|child|学生/.test(combined)) return ethnicityHint + 'parent and child';
    if (/직장인|salarymen|サラリーマン/.test(combined)) return ethnicityHint + 'office worker';

    /* 마지막 폴백 — 빈 값 반환. 컴파일러가 topic+role 기반 phrase 로 보강한다.
       generic placeholder ('an adult relevant to the topic' 등) 는 절대 사용하지 않는다. */
    return '';
  }

  /* ════════════════════════════════════════════════
     camera / motion priority — role + must-show
     ════════════════════════════════════════════════ */
  function _cameraPriority(role, mustObjects){
    var props = (mustObjects || []).join(' ').toLowerCase();
    if (role === 'hook') {
      if (/scale|blood pressure|prescription/.test(props)) return 'tight close-up on the displayed value';
      return 'medium shot with strong focal point creating curiosity';
    }
    if (role === 'setup')                 return 'establishing wide-medium shot showing relationship and place';
    if (role === 'conflict_or_core') {
      if (/knee|stairs|handrail|cane/.test(props))   return 'medium with insert close-up of the body part action';
      return 'medium shot revealing the core problem with insert detail';
    }
    if (role === 'reveal_or_solution')     return 'cinematic medium close-up showing the resolving action';
    if (role === 'cta')                    return 'close-up of hand reaching toward an actionable object';
    return 'stable medium shot';
  }
  function _motionPriority(role, mustActions, mustEmotion, projectProfile){
    var act = (mustActions || []).join(' ').toLowerCase();
    var emo = (mustEmotion || []).join(' ').toLowerCase();
    var motions = [];
    if (/climbing stairs/.test(act))            motions.push('careful step-by-step climb');
    if (/stepping on the scale/.test(act))      motions.push('small weight-shift onto the scale');
    if (/answering the phone/.test(act))        motions.push('lifting the phone to the ear');
    if (/measuring blood pressure/.test(act))   motions.push('cuff inflating, eyes following the readout');
    if (/tapping the save button/.test(act))    motions.push('thumb taps the save button');
    if (/holding the object/.test(act))         motions.push('hands gently holding the object');
    if (/restrained regret/.test(emo))          motions.push('eyes lower briefly');
    if (/relief/.test(emo))                     motions.push('shoulders relax with a deep breath');
    if (/quiet determination/.test(emo))        motions.push('steady gaze, slight forward step');
    if (/genuine surprise/.test(emo))           motions.push('shoulders lift, eyebrows raise');
    if (projectProfile && projectProfile.genre === 'comic') {
      motions.push('start in neutral pose, payoff with a comedic reaction');
    }
    if (projectProfile && projectProfile.genre === 'animal_anime') {
      motions.push('soft bounce, small head-tilt, paw gesture');
    }
    if (!motions.length) {
      if (role === 'hook')                    motions.push('subtle attention shift toward the focal point');
      else if (role === 'setup')              motions.push('natural breathing, slow scene establishment');
      else if (role === 'reveal_or_solution') motions.push('action unfolds smoothly toward resolution');
      else if (role === 'cta')                motions.push('hand extends toward the action surface');
      else                                    motions.push('natural goal-driven movement');
    }
    return motions.join('; ');
  }

  /* ════════════════════════════════════════════════
     keyMessage / narrativeGoal / visualGoal
     ════════════════════════════════════════════════ */
  function _trim(s, n){ s = String(s||'').replace(/\s+/g,' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }
  function _keyMessage(scene, role){
    var s = scene && (scene.summary || scene.caption || scene.narration || scene.imagePrompt || scene.videoPrompt) || '';
    return _trim(s, 140);
  }
  function _narrativeGoalForRole(role){
    return ({
      hook: '시청자 시선을 1초 안에 잡고 호기심을 만든다',
      setup: '관계·맥락·상황을 짧게 보여주어 본론으로 진입한다',
      conflict_or_core: '핵심 문제·정보를 시각적으로 명확히 드러낸다',
      reveal_or_solution: '해결 또는 핵심 통찰을 행동으로 보여준다',
      cta: '시청자가 다음 행동을 떠올릴 수 있는 마무리 컷을 만든다',
    })[role] || '대본 의도에 맞는 시각 메시지를 전달한다';
  }
  function _visualGoalForRole(role){
    return ({
      hook: 'unusual framing or emotional tension that creates an immediate question',
      setup: 'establishing composition that reads relationship and place at a glance',
      conflict_or_core: 'must-show evidence (object, action) is unmistakably visible',
      reveal_or_solution: 'resolution-oriented action body language with clear payoff',
      cta: 'composition that invites the viewer to act, with hand or product framed',
    })[role] || 'script-grounded scene with specific evidence';
  }

  /* avoidList — taboo + role/genre 추가 회피 */
  function _avoidList(projectProfile, role){
    var base = (projectProfile && projectProfile.tabooElements) || [];
    var extra = [];
    if (role === 'cta') {
      extra.push('avoid expressionless frontal portrait without action');
    }
    if (role === 'hook') {
      extra.push('avoid plain centered headshot without context');
    }
    if (role === 'reveal_or_solution') {
      extra.push('avoid still pose without resolving action');
    }
    if (projectProfile && projectProfile.genre === 'info') {
      extra.push('avoid abstract emotional metaphors without props');
    }
    if (projectProfile && projectProfile.genre === 'wisdom') {
      extra.push('avoid literal quote card or text overlay simulation');
    }
    return base.concat(extra);
  }

  /* ════════════════════════════════════════════════
     main: analyzeSceneIntentV4
     ════════════════════════════════════════════════ */
  function analyzeSceneIntentV4(scene, projectProfile, sceneIndex, total){
    scene = scene || {};
    var allTotal = total || (scene._total || 5);
    var role = _resolveRole(scene, sceneIndex || 0, allTotal);

    var narration = _coerce(scene.narration || scene.text || scene.script || scene.lines);
    var visualDesc = _coerce(scene.visualDescription || scene.visual_description || scene.visual);
    var caption = _coerce(scene.caption || scene.title || scene.label);
    var rawCombined = [narration, visualDesc, caption].filter(Boolean).join('\n');

    /* evidence 카테고리별 추출 */
    var mustShowObjects     = _extractAll(OBJECT_RULES,  rawCombined);
    var mustShowActions     = _extractAll(ACTION_RULES,  rawCombined);
    var mustShowEmotion     = _extractAll(EMOTION_RULES, rawCombined);
    var mustShowEnvironment = _extractAll(ENV_RULES,     rawCombined);
    var timeMatches         = _extractAll(TIME_RULES,    rawCombined);
    var timeOfDay = timeMatches[0] || '';

    /* subject / relationship / count / age / gender */
    var subjectCount = _detectSubjectCount(rawCombined);
    var relationship = _detectRelationship(rawCombined);
    var age = _detectAge(rawCombined, projectProfile);
    var gender = _detectGender(rawCombined);
    var subject = _decideSubject(rawCombined, projectProfile, subjectCount, relationship);

    /* location — 첫 번째 환경 또는 continuitySetting 폴백 */
    var location = mustShowEnvironment[0] || ((projectProfile && projectProfile.continuitySetting && projectProfile.continuitySetting[0]) || '');

    /* wardrobe — projectProfile 의 continuityWardrobe 첫 번째 사용 */
    var wardrobe = (projectProfile && projectProfile.continuityWardrobe && projectProfile.continuityWardrobe[0]) || '';

    /* continuityAnchor — character 의 첫 번째 항목, 다음 씬에서도 일관 */
    var continuityAnchor = (projectProfile && projectProfile.continuityCharacters && projectProfile.continuityCharacters[0]) || '';

    /* startSec / endSec — scene.time 형식 "10~15초" 파싱 */
    var startSec = 0, endSec = 0;
    var t = String(scene.time || scene.duration || '');
    var m = t.match(/(\d+)\s*[~\-–]\s*(\d+)/);
    if (m) { startSec = +m[1]; endSec = +m[2]; }
    else {
      var m2 = t.match(/(\d+)\s*초/);
      if (m2) endSec = +m2[1];
    }

    return {
      sceneIndex:           sceneIndex || 0,
      role:                 role,
      startSec:             startSec,
      endSec:               endSec,
      summary:              _trim(rawCombined, 200),
      narrativeGoal:        _narrativeGoalForRole(role),
      visualGoal:           _visualGoalForRole(role),
      keyMessage:           _keyMessage(scene, role),
      subject:              subject,
      subjectCount:         subjectCount,
      age:                  age,
      gender:               gender,
      ethnicity:            (projectProfile && projectProfile.audience === 'korean_senior')   ? 'Korean'
                          : (projectProfile && projectProfile.audience === 'japanese_senior') ? 'Japanese'
                          : '',
      relationship:         relationship,
      mustShowObjects:      mustShowObjects,
      mustShowActions:      mustShowActions,
      mustShowEmotion:      mustShowEmotion,
      mustShowEnvironment:  mustShowEnvironment,
      location:             location,
      timeOfDay:            timeOfDay,
      wardrobe:             wardrobe,
      continuityAnchor:     continuityAnchor,
      cameraPriority:       _cameraPriority(role, mustShowObjects),
      motionPriority:       _motionPriority(role, mustShowActions, mustShowEmotion, projectProfile),
      avoidList:            _avoidList(projectProfile, role),
      evidenceText:         _trim(rawCombined, 600),
      version:              'v4'
    };
  }
  window.analyzeSceneIntentV4 = analyzeSceneIntentV4;

  /* ════════════════════════════════════════════════
     analyzeAllSceneIntentsV4 — 차별화 힌트 누적
     ════════════════════════════════════════════════ */
  function analyzeAllSceneIntentsV4(projectProfile){
    var profile = projectProfile || (typeof window.analyzeProjectProfileV4 === 'function'
                                     ? window.analyzeProjectProfileV4() : null);
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    var total = scenes.length;
    if (!total) return [];
    var intents = scenes.map(function(sc, i){
      return analyzeSceneIntentV4(sc, profile, i, total);
    });
    /* 중복 mustShow 누적 카운트 — differentiation 점수에 사용 */
    var globalCounts = {};
    intents.forEach(function(it){
      [].concat(it.mustShowObjects || [], it.mustShowActions || [], it.mustShowEmotion || []).forEach(function(x){
        globalCounts[x] = (globalCounts[x] || 0) + 1;
      });
    });
    intents.forEach(function(it){
      it.differentiationHints = (it.mustShowObjects || []).filter(function(x){
        return (globalCounts[x] || 0) === 1;
      }).slice(0, 3);
    });
    return intents;
  }
  window.analyzeAllSceneIntentsV4 = analyzeAllSceneIntentsV4;
})();
