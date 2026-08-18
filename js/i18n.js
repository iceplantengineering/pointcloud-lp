/* ══════════════════════════════════════════════════════════
   点群計測 × リバースエンジニアリング 提案LP — 言語切り替え（日本語 / English）
   ICE（アイ・シー・エンジニアリング株式会社）

   方式:
     - HTML は日本語を既定の内容として保持（SEO・初期表示は日本語）
     - 翻訳辞書は日本語テキスト（正規化済み）をキーとする
     - 適用時はテキストノードを走査し、辞書に一致したノードの
       前後空白を保ったまま英語へ置換（元のテキストは復元用に保存）
     - 属性（aria-label / placeholder / title）は data-i18n-attr 属性で
       HTML 側に注入済み（data-i18n-attr="日本語" data-i18n-attr-name="属性名"）
     - 選択言語は localStorage に保存（キー: pointcloud-lp-lang）
   依存: なし（純粋なブラウザAPIのみ）
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'pointcloud-lp-lang';

  /* ── 翻訳辞書（日本語テキスト → 英語） ── */
  var I18N_EN = {
    /* タイトル・ナビ */
    '点群計測 × リバースエンジニアリング | 溶接アッセンブリー治具のデジタル資産化 — アイ・シー・エンジニアリング株式会社（ICE）': 'Point Cloud Measurement × Reverse Engineering | Digital Assetization of Welding Assembly Jigs — I.C. Engineering Co., Ltd. (ICE)',
    '課題': 'Challenges',
    'サービス全体像': 'Service Overview',
    '計測体制': 'Measurement Structure',
    '提供範囲': 'Scope of Services',
    '海外実績': 'Overseas Track Record',
    '進め方': 'Process',
    '確認項目': 'Checklist',
    '体制': 'Organization',
    'お問い合わせ': 'Contact',

    /* ヒーロー */
    'アイ・シー・エンジニアリング株式会社（ICE）× ナベヤ製作所（ナベヤ）× JI Technovation Private Limited（JIT）': 'I.C. Engineering Co., Ltd. (ICE) × Japan Metrology Solution NABEYA MFG × JI Technovation Private Limited (JIT)',
    '点群計測 × リバースエンジニアリング': 'Point Cloud Measurement × Reverse Engineering',
    '溶接アッセンブリー治具のデジタル資産化': 'Digital Assetization of Welding Assembly Jigs',
    '図面のない治具も、点群データからCADモデルへ。': 'Jigs without drawings — from point cloud data to CAD models.',
    '計測からエンジニアリング・ハードウェア対応まで、一気通貫でご提供します。': 'We provide a one-stop flow from measurement through engineering and hardware support.',
    'お問い合わせはこちら': 'Contact Us',
    'サービス全体像を見る': 'See the Service Overview',
    'FAROアーム等による計測精度': 'Measurement accuracy with FARO arm, etc.',
    '約': 'approx.',
    'レーザートラッカーによる計測精度': 'Measurement accuracy with laser tracker',
    '※ 対象物・測定環境によりモデル化・点群取得の可能範囲は変動します。詳細は「計測体制」をご覧ください。': '※ The feasible range of modeling and point cloud acquisition varies with the object and measurement environment. See “Measurement Structure” for details.',

    /* 01 課題 */
    'なぜ、いまリバースエンジニアリングなのか': 'Why Reverse Engineering, Now?',
    '生産設備の長寿命化が進むほど、「図面のない治具」はリスク資産になります。': 'The longer production equipment stays in service, the more “jigs without drawings” become risk assets.',
    '現物合わせの綱渡りから、数値で管理できるデジタル資産への転換が求められています。': 'The industry needs to move from ad-hoc fit-up work to digital assets managed by numerical data.',
    '図面・3Dデータの消失・散逸': 'Loss and Dispersal of Drawings and 3D Data',
    '経年稼働とともに原图面が紛失・散逸し、補修や再製作のたびに「現物から採寸する」状態が常態化していませんか。担当者の変更で暗黙知も失われます。': 'As equipment ages, original drawings are lost or scattered, making “measure from the actual part” the norm for every repair or rebuild. When the responsible staff change, tacit knowledge is lost too.',
    '精度劣化の定量化ができない': 'Deterioration Cannot Be Quantified',
    '経年変化・打痕・摩耗により基準面や位置決め部の精度は必ず劣化します。数値化されていないため「どこが・どれだけ劣化したか」を担保できず、品質議論が感度論に頼ります。': 'Aging, dents, and wear inevitably degrade the accuracy of datum surfaces and locating features. Without numerical records, the extent of deterioration cannot be evidenced, and quality discussions rely on subjective impressions.',
    '補修部品の調達困難・現物合わせの反復': 'Difficult Spare-Part Sourcing and Repeated Fit-Up Work',
    '部品メーカーの系列変更や廃番で補修部品が入手できず、都度の現物合わせ・試行錯誤が繰り返されます。復旧までの時間がそのままライン停止リスクになります。': 'When a parts maker changes affiliation or discontinues a product, spare parts become unavailable and every repair repeats fit-up and trial-and-error. The time to recovery becomes a direct line-stoppage risk.',
    '新規製作は高コスト・長リードタイム': 'New Fabrication Is Costly and Slow',
    '図面なしでの新規製作は、採寸・設計・試作・修正のループを伴い、コストと納期が読めません。「まだ使える治具」を延命する判断も、データがなく定量的な根拠を示せません。': 'Fabricating new without drawings involves loops of measuring, design, prototyping, and rework, making cost and delivery unpredictable. Even the decision to extend the life of a still-usable jig lacks quantitative evidence without data.',
    '「現物しかない」状態からの出発点として、点群データの取得が有効です。': 'Point cloud acquisition is the effective starting point when all you have is the physical jig.',
    '点群は治具の現状を加工・解体を伴わず非接触で丸ごと記録します。そこからCADモデル・図面・精度記録を整備すれば、補修・更新・新規設計のいずれの意思決定も数値に基づいて進められます。': 'Point clouds record the full current state of a jig non-contact, without machining or disassembly. From there, CAD models, drawings, and accuracy records can be built, enabling data-driven decisions for repair, renewal, or new design.',

    /* 02 ワンストップフロー */
    'サービス全体像 — ワンストップフロー': 'Service Overview — One-Stop Flow',
    '点群データの取得からエンジニアリング・ハードウェア対応まで、': 'From point cloud acquisition to engineering and hardware support,',
    '一気通貫のフローとしてご提供します。': 'we offer an end-to-end, one-stop flow.',
    'ワンストップフロー図': 'One-stop flow diagram',
    '点群データ取得、メッシュ化、CADモデル化、精度検証、エンジニアリング展開、ハードウェア対応の6工程。各工程の ICE／JIT／ナベヤ製作所／パートナー担当の色分けを示す。': 'Six steps: point cloud acquisition, meshing, CAD modeling, accuracy verification, engineering development, and hardware support. Colors indicate the responsible party for each step (ICE / JIT / Japan Metrology Solution NABEYA MFG / partners).',
    'ICE 担当': 'ICE',
    'パートナー担当': 'Partner',
    'ICE＋パートナー': 'ICE + Partner',
    'ICE＋JIT': 'ICE + JIT',
    'ICE＋': 'ICE + ',
    '協業（ICE＋JIT／ICE＋ナベヤ製作所）': 'Collaboration (ICE + JIT / ICE + NABEYA MFG)',
    '点群データ取得': 'Point Cloud Acquisition',
    'FAROアーム等／レーザートラッカー': 'FARO arm / laser tracker',
    '現地または協業パートナー工場にて': 'On-site or partner facility',
    'パートナー：計測': 'Partner: measurement',
    'メッシュ化': 'Meshing',
    'ノイズ除去・統合・簡略化': 'Noise removal & merging',
    'STL／ポリゴンモデル生成': 'STL / polygon model',
    'ICE＋JIT：データ処理': 'ICE + JIT: processing',
    'CADモデル化': 'CAD Modeling',
    'サーフェス／ソリッド': 'Surface / solid',
    '設計意図を踏まえた再構築': 'Rebuild with design intent',
    'ICE＋JIT：モデリング': 'ICE + JIT: modeling',
    '精度検証': 'Accuracy Verification',
    '点群 vs CAD 照合・偏差評価': 'Point cloud vs. CAD',
    '保証レベルは事前合意': 'Warranty agreed in advance',
    'ICE＋ナベヤ製作所': 'ICE + NABEYA MFG',
    'エンジニアリング展開': 'Engineering Development',
    '2D図面化・改善提案': '2D drawings & proposals',
    '強度・剛性の検討も可能': 'Strength / rigidity study',
    'ICE：総合エンジニアリング': 'ICE: general engineering',
    'ハードウェア': 'Hardware',
    '部品製作・': 'Parts fabrication',
    '治具更新': 'jig renewal',
    'パートナー': 'Partner',
    '主な成果物：': 'Main deliverables:',
    '点群データ（生データ／統合済）・メッシュモデル（STL等）・CADモデル（サーフェス／ソリッド）・精度検証レポート・2D図面・改善提案書・製作部品・更新治具': 'Point cloud data (raw/merged), mesh models (STL, etc.), CAD models (surface/solid), verification reports, 2D drawings, improvement proposals, fabricated parts, renewed jigs',
    '※ 点群取得・精度検証は ICE＋ナベヤ製作所、点群処理〜CADモデル化は ICE＋JIT、総合エンジニアリングは ICE が受け持ち、ハードウェアは内容に応じて製作パートナーと体制を組んでご提供します。': '※ Acquisition & verification: ICE + NABEYA MFG · Processing → CAD modeling: ICE + JIT · General engineering: ICE · Hardware: with fabrication partners',
    'FAROアーム等／レーザートラッカーによる計測（ICE＋ナベヤ製作所）': 'Measurement with FARO arm, etc. / laser tracker (ICE + NABEYA MFG)',
    'ノイズ除去・統合・簡略化、STL／ポリゴンモデル生成（ICE＋JIT）': 'Noise removal, merging, simplification; STL / polygon model generation (ICE + JIT)',
    'サーフェス／ソリッド・設計意図を踏まえた再構築（ICE＋JIT）': 'Surface / solid rebuild reflecting design intent (ICE + JIT)',
    '点群 vs CAD 照合・偏差評価（ICE＋ナベヤ製作所、保証レベルは事前合意）': 'Point cloud vs. CAD comparison and deviation evaluation (ICE + NABEYA MFG; warranty level agreed in advance)',
    '2D図面化・改善提案・強度剛性検討（ICE）': '2D drawings, improvement proposals, strength/rigidity analysis (ICE)',
    'ハードウェア対応': 'Hardware support',
    '部品製作・治具更新・調達（ICE窓口＋パートナー製作）': 'Parts fabrication, jig renewal, procurement (ICE window + partner fabrication)',

    /* 03 計測体制 */
    '計測体制 — 国内パートナーとの連携': 'Measurement Structure — Partnership with a Domestic Partner',
    '岐阜県のナベヤ製作所（略称：ナベヤ）と連携し、国内で完結する計測体制を構築しています。': 'We have built a fully domestic measurement structure in partnership with Japan Metrology Solution NABEYA MFG (abbreviated as NABEYA) in Gifu Prefecture.',
    '測定方法と精度': 'Measurement Methods and Accuracy',
    'FAROアーム等': 'FARO arm, etc.',
    '（接触式・携帯型測定機）': '(contact-type, portable measuring device)',
    '約 0.05': 'approx. 0.05',
    '治具の部品単位・特徴部位の高精度計測に適する': 'Suitable for high-accuracy measurement of individual jig components and key features',
    '持ち運び可能なため現場への搬入が容易': 'Portable, so easy to bring onto the production floor',
    '位置決め部・基準面など重点部位の採寸に最適': 'Ideal for measuring critical areas such as locating features and datum surfaces',
    'レーザートラッカー': 'Laser tracker',
    '（大寸法・基準構造計測）': '(large-dimension and reference-structure measurement)',
    '約 0.1': 'approx. 0.1',
    '治具全体の基準・配置関係の計測に適する': 'Suitable for measuring the overall reference and layout relationships of the jig',
    '数メートル級の大型構造でも安定した計測が可能': 'Stable measurement even for large structures of several meters',
    'ベースフレーム・ロケート位置の関係把握に最適': 'Ideal for understanding the relationship between the base frame and locate positions',
    '計測パートナー': 'Measurement partner',
    'ナベヤ製作所': 'NABEYA MFG',
    '岐阜県': 'Gifu Prefecture',
    '点群取得は、岐阜県のナベヤ製作所と連携した国内計測体制で対応します。ICE が計測計画・データ処理・モデル化の窓口となり、計測実施はナベヤ製作所が担います。現地計測が必要な場合も ICE が一手に引き受け、統一された手順・精度基準でデータを整えます。': 'Point cloud acquisition is handled through our domestic structure with Japan Metrology Solution NABEYA MFG in Gifu Prefecture. ICE serves as the single window for measurement planning, data processing, and modeling, while NABEYA MFG performs the measurements. Even when on-site measurement is required, ICE takes full responsibility and organizes data under unified procedures and accuracy standards.',
    'ナベヤ製作所 公式サイト（sokutei.co.jp）→': 'Japan Metrology Solution NABEYA MFG official website (sokutei.co.jp) →',
    '留意点': 'Important Notes',
    '対象物や測定環境によって、': 'Depending on the object and measurement environment,',
    'モデル化・点群取得の可能範囲は変動': 'the feasible range of modeling and point cloud acquisition may vary',
    'します。': '.',
    'このため当方は、計測の前に': 'Therefore, our policy is to clarify the',
    '「使用目的」「使用環境」を明確にしてから計測計画を策定する': '“purpose of use” and “usage environment” before formulating the measurement plan',
    '方針で進めます。': '.',
    '要求されるモデル精度（測定精度とは別に定義）': 'Required model accuracy (defined separately from measurement accuracy)',
    '治具のサイズ・形状・表面性状（光沢・暗色・油汚れ等）': 'Jig size, shape, and surface condition (glossy, dark, oily, etc.)',
    '計測可能な時間・場所（ライン停止の可否）': 'Available time and location for measurement (whether line stoppage is possible)',
    '→ 詳しい確認項目は': '→ The detailed checklist is organized in',
    '「使用目的・環境の確認項目」': '“Checklist: Purpose of Use and Environment”',
    'で整理しています。': '.',

    /* 04 スコープ */
    'スコープの区分け — ICE の提供範囲': 'Scope Classification — ICE\u2019s Range of Services',
    '工程ごとに、ICE がどこまで対応し、何を成果物としてお渡しできるかを整理しました。': 'For each step, we clarify how far ICE can support and what deliverables we can provide.',
    '「まずはどこまで、どの精度で」を顧客と合意するためのフレームワークとしてご活用ください。': 'Use this as a framework for agreeing with the customer on “how far and at what accuracy, to begin with.”',
    '工程': 'Step',
    '内容': 'Description',
    '提供可否': 'Availability',
    'パートナー/体制': 'Partner / Structure',
    '成果物': 'Deliverable',
    '点群取得': 'Point cloud acquisition',
    'FAROアーム等（約0.05mm）／レーザートラッカー（約0.1mm）による非接触計測': 'Non-contact measurement with FARO arm, etc. (approx. 0.05 mm) / laser tracker (approx. 0.1 mm)',
    '対応可': 'Available',
    'ナベヤ製作所（計測）＋ICE（計測計画・立会）': 'Japan Metrology Solution NABEYA MFG (measurement) + ICE (planning, witnessing)',
    '点群データ（生データ／統合済）': 'Point cloud data (raw / merged)',
    'ノイズ除去・複数視点データ統合・データ簡略化': 'Noise removal, multi-view data merging, data simplification',
    'メッシュモデル（STL等）': 'Mesh model (STL, etc.)',
    'サーフェスモデル': 'Surface model',
    '点群・メッシュからのサーフェス再構築（外形状の忠実な再現）': 'Surface reconstruction from point cloud / mesh (faithful reproduction of external geometry)',
    'サーフェスモデル（IGES／STEP等）': 'Surface model (IGES / STEP, etc.)',
    'ソリッドモデル': 'Solid model',
    '機構として成立するソリッド化（設計意図の復元・簡略化含む）': 'Solid modeling that works as a mechanism (including restoration of design intent and simplification)',
    'ソリッドモデル（STEP／Parasolid等）': 'Solid model (STEP / Parasolid, etc.)',
    '精度検証・保証レベル': 'Accuracy verification / warranty level',
    '点群 vs CADモデルの照合、偏差の可視化・定量化、合否判定': 'Point cloud vs. CAD model comparison, deviation visualization and quantification, pass/fail judgment',
    '条件付き対応': 'Conditional',
    '精度検証レポート（カラーマップ・偏差値）': 'Accuracy verification report (color map, deviation values)',
    '2D図面化': '2D drawing',
    '部品図・組立図の作成、公差・材質・仕上げ記載の整備': 'Creation of part and assembly drawings; documentation of tolerances, materials, and finishes',
    '2D図面（DWG／DXF／PDF）': '2D drawings (DWG / DXF / PDF)',
    'エンジニアリング': 'Engineering',
    '強度・剛性検討、改善提案、類似治具への展開、技術文書化': 'Strength/rigidity analysis, improvement proposals, application to similar jigs, technical documentation',
    '検討書・改善提案書・技術資料': 'Study reports, improvement proposals, technical documents',
    '補修部品・代替部品の製作、治具更新・一部新規製作': 'Fabrication of repair/replacement parts, jig renewal, partial new fabrication',
    '内容により対応': 'Depending on content',
    'ICE（窓口）＋製作パートナー': 'ICE (window) + fabrication partner',
    '製作部品・更新治具・検査成績書': 'Fabricated parts, renewed jigs, inspection certificates',
    '精度検証・保証レベルについて：': 'About accuracy verification and warranty level:',
    '「保証」の内容（対象部位・許容偏差・合格条件）は治具の使用目的に依存します。そのため、計測前に保証レベルを別途ご合意いただく「条件付き対応」としています。測定精度（約0.05mm／約0.1mm）と、お客様が要求されるモデル精度は別物であり、この区別を明確にすることがトラブルを防ぎます。': 'The scope of the “warranty” (target areas, allowable deviation, acceptance criteria) depends on the jig\u2019s purpose of use. We therefore treat it as a “conditional service,” with the warranty level agreed separately before measurement. Measurement accuracy (approx. 0.05 mm / approx. 0.1 mm) and the model accuracy you require are different things; making this distinction clear prevents misunderstandings.',
    'ICE＋JIT 単独または計測パートナー（ナベヤ製作所）との協業で標準的に提供': 'Standard service provided by ICE + JIT alone or in collaboration with the measurement partner (Japan Metrology Solution NABEYA MFG)',
    '事前合意事項（保証レベル・製作内容）の確定後に提供': 'Provided after prior agreement (warranty level, fabrication content) is finalized',

    /* 05 ベンチマーク */
    '参考ベンチマーク — JIT（JI Technovation Private Limited）のインドでの実績': 'Reference Benchmark — JIT (JI Technovation Private Limited) Track Record in India',
    'インド市場で JI Technovation Private Limited（略称：JIT）がマルチスズキ向けに、治具のリバースエンジニアリングからエンジニアリング、ハードウェア受注までを成功させた事例を整理します。': 'We summarize a case in which JI Technovation Private Limited (JIT) successfully delivered reverse engineering, engineering, and hardware orders for Maruti Suzuki in the Indian market.',
    '※ このセクションは参考ベンチマークです。推測を含みます。': '※ This section is a reference benchmark and includes inferences.',
    '公開情報をもとに ICE が整理・推測した内容であり、JIT・マルチスズキ公式見解ではありません。ビジネスモデルの考察部分は特に推測の度合いが高いため、参考情報としてご覧ください。': 'This content is organized and inferred by ICE based on public information and is not an official view of JIT or Maruti Suzuki. The business-model analysis in particular involves a high degree of inference; please treat it as reference information.',
    'JIT 公式サイト（ji-technovation.com）→': 'JIT official website (ji-technovation.com) →',
    '事例サマリー（マルチスズキ向け）': 'Case summary (for Maruti Suzuki)',
    'リバースエンジニアリング': 'Reverse engineering',
    '— 図面のない既存治具を計測し、CADモデル・図面を復元': '— Measured existing jigs without drawings and restored CAD models and drawings',
    'エンジニアリング作業': 'Engineering work',
    '— 復元データをもとに技術検討・改善・設計展開を実施': '— Conducted technical studies, improvements, and design development based on the restored data',
    'ハードウェア受注': 'Hardware orders',
    '— 検討結果を踏まえた部品・治具の製作受注まで獲得': '— Won orders for parts and jig fabrication based on the study results',
    '対象市場：インド（現地計測＋設計リソースの組み合わせで対応）': 'Target market: India (served by combining on-site measurement with design resources)',
    'ビジネスモデルの考察（推測を含む）': 'Business model analysis (includes inference)',
    'ワンストップ受注': 'One-stop ordering',
    '計測〜ハードウェアまで一括受注により、顧客の調達・管理の手間を集約。個別工程の分割発注より価格決定権と関係の深度が高まると推測されます。': 'One-stop ordering from measurement through hardware consolidates the customer\u2019s procurement and management burden. It is inferred that this strengthens pricing power and relationship depth compared with splitting orders by step.',
    '現地計測＋設計リソースの組み合わせ': 'Combination of on-site measurement and design resources',
    '計測は現地で実施し、モデリング・設計は最適な場所のリソースで処理。実績から、計測と設計の担当を柔軟に分離・統合する体制が有効と考えられます。': 'Measurement is performed on-site while modeling and design are processed by resources in the optimal location. The track record suggests that flexibly separating or integrating measurement and design responsibilities is effective.',
    '治具ライフサイクルにわたる長期関係構築': 'Building Long-Term Relationships Across the Jig Lifecycle',
    '一度デジタル化すれば、以降の補修・更新・類似治具展開は同じデータ資産から派生します。初回受注が長期収益の起点になる構造と推測されます。': 'Once digitalized, subsequent repairs, renewals, and applications to similar jigs derive from the same data asset. This structure is inferred to make the first order the starting point of long-term revenue.',

    /* 06 進め方 */
    '進め方 — Step 0 から始まるストーリーライン': 'Process — A Storyline Starting from Step 0',
    'まず「何のために・どこまで」を合意するところから始め、計測・モデル化・検証・納品を経てエンジニアリング展開へつなげます。': 'We begin by agreeing on “why and how far,” then proceed through measurement, modeling, verification, and delivery into engineering development.',
    '顧客＋ICE': 'Customer + ICE',
    '使用目的・環境の確認': 'Confirm Purpose of Use and Environment',
    'チェックリストで使用目的・使用環境・要求精度・ゴールを確認し、合意します。ここが曖昧なまま計測に入ると、後工程すべての手戻りにつながります。': 'Use the checklist to confirm and agree on the purpose of use, usage environment, required accuracy, and goals. Entering measurement with these unclear leads to rework in every later step.',
    '確認項目チェックリスト（合議済）・計測前提条件表': 'Agreed checklist; measurement preconditions table',
    '予備調査・計測計画': 'Preliminary Survey and Measurement Plan',
    '対象治具の現状（サイズ・構成・表面状態）を確認し、計測機の選定（FAROアーム等／レーザートラッカー）、計測範囲・アライメント方式・所要時間を計画します。': 'Confirm the current state of the target jig (size, configuration, surface condition), select the measuring device (FARO arm, etc. / laser tracker), and plan the measurement range, alignment method, and required time.',
    '計測計画書・計測見積り': 'Measurement plan and quotation',
    'ナベヤ製作所＋ICE': 'NABEYA MFG + ICE',
    '計画に基づき現地または協業先で点群を取得します。ICE が立会・手順管理を行い、不足なく取得できているかをその場で確認します。': 'Acquire point clouds on-site or at a partner location according to the plan. ICE witnesses and manages procedures, verifying on the spot that data is captured without omissions.',
    'メッシュ化・CADモデル化': 'Meshing and CAD Modeling',
    'ノイズ除去・統合を行いメッシュを生成した後、使用目的に応じてサーフェス／ソリッドモデルへ再構築します。単なる形状トレースではなく、設計意図を踏まえたモデル化を行います。': 'After noise removal and merging to generate a mesh, rebuild into surface/solid models according to the purpose of use. Modeling reflects design intent rather than mere shape tracing.',
    'メッシュモデル・CADモデル（サーフェス／ソリッド）': 'Mesh model, CAD model (surface / solid)',
    'ICE＋顧客': 'ICE + Customer',
    '精度検証・合否確認': 'Accuracy Verification and Acceptance',
    '点群とCADモデルを照合し、偏差をカラーマップ等で可視化して定量化します。事前に合意した保証レベルに対する合否を、お客様と一緒に確認します。': 'Compare the point cloud with the CAD model and quantify deviations using color maps and other visualizations. Confirm acceptance against the agreed warranty level together with the customer.',
    '精度検証レポート（偏差マップ・数値）': 'Accuracy verification report (deviation map, values)',
    '成果物納品': 'Deliverables',
    '点群・メッシュ・CADモデル・精度レポート（・2D図面）を一式納品します。以降の補修・更新・新規設計のいずれにも使える形でデータ資産をお引き渡しします。': 'Deliver a complete set of point clouds, meshes, CAD models, and accuracy reports (plus 2D drawings). Hand over the data asset in a form usable for future repairs, renewals, or new design.',
    '納品データ一式・取扱い説明資料': 'Complete data package; handling guide',
    'ICE＋製作パートナー': 'ICE + fabrication partner',
    'エンジニアリング・ハードウェア展開': 'Engineering and Hardware Development',
    '納品データを起点に、強度・剛性の検討、改善提案、補修部品の製作、治具更新へと展開します。データがあるからこそ、従来は「現物合わせ」だった領域を設計課題として扱えます。': 'Building on the delivered data, proceed to strength/rigidity analysis, improvement proposals, fabrication of repair parts, and jig renewal. With data, areas that previously required fit-up work can be treated as design tasks.',
    '検討書・改善提案書・製作部品・更新治具': 'Study reports, improvement proposals, fabricated parts, renewed jigs',
    '顧客主体': 'Customer-led',
    '協業': 'Collaboration',

    /* 07 チェックリスト */
    '使用目的・環境の確認項目': 'Checklist: Purpose of Use and Environment',
    '計測計画を策定する前に、必ず確認・合意する項目です。': 'Items to be confirmed and agreed before formulating the measurement plan.',
    '打合せの議事録としてそのまま使えるよう、チェックリスト形式で整理しています。': 'Organized as a checklist that can be used directly as meeting minutes.',
    '確認進捗': 'Progress',
    '※ 進捗はブラウザ内での目安です（外部送信なし）': '※ Progress is tracked locally in your browser only (no data is sent)',
    'チェックを入れていただければ、お見積り・計測計画の精度が上がります。そのまま印刷して打合せにご活用ください。': 'Checking items improves the accuracy of quotations and measurement plans. Print it and use it in your meetings.',
    '対象治具の用途': 'A. Purpose of the Target Jig',
    '溶接品質の確保（溶接位置・電極加圧の安定）': 'Ensuring weld quality (stable weld position and electrode pressure)',
    '位置決め（部品の基準・心出しの役割）': 'Locating (reference and centering of parts)',
    'クランプ（挟持・固定の動作を含む）': 'Clamping (including holding and fixing action)',
    'その他の用途': 'Other purposes',
    '要求精度': 'B. Required Accuracy',
    '測定精度と必要とされるモデル精度の区別を認識済み': 'Recognized the difference between measurement accuracy and required model accuracy',
    '位置決め部・基準面の精度目安': 'Accuracy target for locating features and datum surfaces',
    'その他部位の精度目安': 'Accuracy target for other areas',
    '合否判定の方法（全数検査／抜取り検査）を取り決め済み': 'Agreed on acceptance method (100% inspection / sampling)',
    '使用環境': 'C. Usage Environment',
    '温度条件（常温／高温環境）': 'Temperature conditions (ambient / high-temperature environment)',
    '油・粉塵等の付着の有無と程度': 'Presence and degree of oil, dust, etc.',
    '振動の有無（計測への影響評価を含む）': 'Vibration (including evaluation of its effect on measurement)',
    'レイアウト制約（治具周辺の作業スペース・搬入経路）': 'Layout constraints (workspace around the jig, access route)',
    '既存図面・3Dデータの有無': 'D. Existing Drawings / 3D Data',
    '既存図面の有無（全部／一部／なし）': 'Existing drawings (all / partial / none)',
    '既存3Dデータの有無（CADデータ・解析用メッシュ等）': 'Existing 3D data (CAD data, analysis mesh, etc.)',
    '過去の計測記録・精度検証記録の有無': 'Previous measurement / accuracy verification records',
    '参照できる類似治具の図面・実績の有無': 'Drawings or track record of similar jigs available for reference',
    '稼働状況と計測可能時間': 'E. Operation Status and Available Measurement Time',
    '治具の稼働状況（稼働中／待機中／退避済）': 'Jig operation status (in operation / standby / removed)',
    'ライン停止の可否（停止可／不可／時間帯限定）': 'Line stoppage (possible / not possible / time-limited)',
    '計測可能な時間帯・時間数': 'Available time slots and hours',
    '治具の搬出可否（持ち出して計測する余地）': 'Whether the jig can be moved out for measurement',
    '対象点数・優先順位、予算・納期イメージ': 'F. Number of Jigs, Priorities, Budget and Delivery Image',
    '対象治具の点数': 'Number of target jigs',
    '優先順位（先行着手する治具の選定）': 'Priority (selection of jigs to start with)',
    '予算イメージ（概算レベルで可）': 'Budget image (rough estimate is fine)',
    '納期イメージ（希望日程・制約）': 'Delivery image (desired schedule, constraints)',
    'ゴール（最終目的）': 'G. Goal (Ultimate Objective)',
    '現状把握（精度劣化の定量化・記録化）': 'Understanding current condition (quantifying and recording accuracy deterioration)',
    '補修部品の製作（現物合わせからの脱却）': 'Fabrication of repair parts (moving away from fit-up work)',
    '治具の更新（一部改修／リプレース計画）': 'Jig renewal (partial modification / replacement plan)',
    '新規設計のベース（類似治具・次期設計の入力）': 'Basis for new design (input for similar jigs and next-generation design)',
    'ご記入いただいた内容は、Step 1 の計測計画・お見積りに直接反映されます。不明な項目は空白のままでも構いません — 打合せで一緒に埋めることも可能です。': 'Your entries are reflected directly in the Step 1 measurement plan and quotation. Items you are unsure about can be left blank — we can fill them in together during the meeting.',
    'チェックリストの内容を相談する': 'Consult Us About the Checklist',

    /* 08 体制 */
    '体制 — 役割分担（ICE・JIT・ナベヤ製作所）': 'Organization — Roles (ICE / JIT / Japan Metrology Solution NABEYA MFG)',
    'H-ONE 様に対して、ICE（窓口・総合エンジニアリング）、JIT（デジタルエンジニアリング）、ナベヤ製作所（計測）が役割と責任範囲を分担してご提供します。': 'For H-ONE, ICE (single window and general engineering), JIT (digital engineering), and Japan Metrology Solution NABEYA MFG (measurement) share clearly defined roles and responsibilities.',
    '体制図': 'Organization chart',
    'H-ONE（顧客）と ICE（窓口・総合エンジニアリング・プロジェクト管理）、JIT（デジタルエンジニアリング）、ナベヤ製作所（計測）の関係を示す体制図。ICEが顧客との窓口を担う。': 'Organization chart showing the relationship between H-ONE (customer), ICE (single window, general engineering, project management), JIT (digital engineering), and Japan Metrology Solution NABEYA MFG (measurement). ICE serves as the customer\u2019s single point of contact.',
    '顧客': 'Customer',
    '・使用目的・環境の確定': '· Confirm purpose & environment',
    '・保証レベルの合意・合否確認': '· Agree warranty & acceptance',
    '窓口・総合エンジニアリング': 'Single Window & General Engineering',
    '・ご契約窓口の一本化': '· Single point of contract',
    '・計測計画の策定・品質管理': '· Measurement planning & QC',
    '・図面化・強度検討・改善提案': '· Drawings, strength & proposals',
    '・プロジェクト管理・定期報告': '· Project management & reporting',
    'デジタルエンジニアリング': 'Digital Engineering',
    '・点群データ処理・メッシュ化': '· Point cloud processing & meshing',
    '・CADモデル化（サーフェス等）': '· CAD modeling (surface, etc.)',
    '・精度検証（点群 vs CAD 照合）': '· Accuracy verification (vs. CAD)',
    '計測': 'Measurement',
    '・点群データ取得（岐阜県）': '· Point cloud acquisition (Gifu)',
    '・FAROアーム等／レーザートラッカー': '· FARO arm, etc. / laser tracker',
    '・計測立会・初期データ確認': '· Witness & initial data check',
    '要件・合意': 'Requirements',
    '成果物・報告': 'Deliverables',
    'CADモデル・図面': 'CAD & drawings',
    '処理委託': 'Outsourcing',
    '計測計画': 'Measurement plan',
    '点群データ': 'Point cloud data',
    '役割分担のポイント': 'Key Points of Role Sharing',
    '・ご契約窓口は ICE に一本化（計測〜モデル化〜エンジニアリングまで） ・計測はナベヤ製作所（岐阜県）が担当': '· ICE: single contract window (measurement → modeling → engineering)  · Measurement: Japan Metrology Solution NABEYA MFG (Gifu)',
    '・総合エンジニアリング（図面化・検討・改善）は ICE、デジタルエンジニアリング（点群処理・メッシュ化・CADモデル化・精度検証）は JIT が担当': '· General engineering (drawing, study, improvement): ICE · Digital engineering (processing, meshing, CAD modeling, verification): JIT',
    '・進捗・課題の定期報告（週次または随時） ・機密情報の管理（点群データ・図面の取り扱い規定に基づく）': '· Periodic progress & issue reports (weekly or as needed)  · Confidentiality management (point cloud & drawing handling rules)',

    /* 09 お問い合わせ */
    'まずは1台から、': 'Start with just one jig —',
    'トライアル計測をご提案します': 'we propose a trial measurement',
    '対象治具・ご希望のゴールを伺えば、計測計画と費用の概算を迅速にご提示します。はじめの相談だけなら、ライン情報・図面などの機密情報は必要ありません。': 'Tell us the target jig and your desired goal, and we will promptly provide a measurement plan and cost estimate. For an initial consultation, no confidential information such as line data or drawings is required.',
    'まずはヒアリング（30分程度）で使用目的・環境を整理': '1. An initial meeting (about 30 minutes) to clarify the purpose of use and environment',
    '計測計画書と概算をお渡しします（相談のみでも可）': '2. We provide a measurement plan and rough estimate (consultation only is fine)',
    '1台からのトライアル計測で精度・成果物を実感してから本格化を判断': '3. Experience the accuracy and deliverables with a trial measurement starting from one jig, then decide on full-scale implementation',
    'ICE 公式サイト（icej.co.jp）': 'ICE official website (icej.co.jp)',
    'この提案資料を印刷 / PDF保存': 'Print / Save This Proposal as PDF',
    'お問い合わせは ICE 担当窓口までお気軽にどうぞ。資料の内容についてご質問がある場合も、上記サイトのお問い合わせフォームよりご連絡ください。': 'Please feel free to contact the ICE representative. If you have questions about this document, use the contact form on the website above.',

    /* フッター */
    'アイ・シー・エンジニアリング株式会社': 'I.C. Engineering Co., Ltd.',
    '本資料は提案用LPです。記載の計測精度（約0.05mm／約0.1mm）は測定機仕様に基づく目安であり、実測値を保証するものではありません。': 'This document is a proposal LP. The stated measurement accuracies (approx. 0.05 mm / approx. 0.1 mm) are estimates based on measuring-device specifications and do not guarantee actual measured values.',
    'ページ上部へ戻る': 'Back to top',
    '© アイ・シー・エンジニアリング株式会社 — 提案資料（H-ONE 様向け）': '© I.C. Engineering Co., Ltd. — Proposal document (for H-ONE)',

    /* 属性（aria-label / placeholder / title） */
    'ICE アイ・シー・エンジニアリング株式会社 トップへ': 'ICE I.C. Engineering Co., Ltd. — Top',
    'セクションナビゲーション': 'Section navigation',
    'メニューを開く': 'Open menu',
    'ワンストップフロー（一覧）': 'One-stop flow (overview)',
    'その他の用途の自由記述': 'Free description for other purposes',
    '記入欄': 'Notes',
    '位置決め部の精度目安': 'Accuracy target for locating features',
    '温度条件': 'Temperature conditions',
    '例：±0.1mm': 'e.g. ±0.1 mm',
    '例：±0.5mm': 'e.g. ±0.5 mm',
    '例：常温': 'e.g. ambient',
    '計測可能時間': 'Available measurement time',
    '例：メンテ夜勤 20:00-24:00': 'e.g. maintenance night shift 20:00-24:00',
    '対象点数': 'Number of target jigs',
    '例：12台': 'e.g. 12 jigs'
  };

  /* ── 言語適用 ── */
  var saved = []; // { node, orig } 復元用

  function norm(s) {
    return s.replace(/\s+/g, ' ').trim();
  }

  /* 正規表現エスケープ + 辞書キーの空白を「任意の空白列」に緩和する正規表現を生成。
     原文に全角スペース（U+3000）等が含まれる場合、辞書キー（正規化済み）がそのまま
     原文に一致しないため、replace が失敗して日本語が残る不具合の対策。 */
  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function buildRe(key) {
    return new RegExp(escapeRe(key).replace(/\s+/g, '\\s+'));
  }

  function applyLang(lang) {
    var en = lang === 'en';

    // 1) テキストノード
    if (en) {
      // 英語適用: 日本語ノードを走査して辞書翻訳（初回のみ原文を保存）
      var walker = document.createTreeWalker(
        document,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (n) {
            var p = n.parentNode;
            if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      var nodes = [];
      var cur;
      while ((cur = walker.nextNode())) nodes.push(cur);

      nodes.forEach(function (node) {
        var key = norm(node.nodeValue);
        if (!key || !I18N_EN.hasOwnProperty(key)) return;
        var rec = saved.filter(function (r) { return r.node === node; })[0];
        if (!rec) {
          rec = { node: node, orig: node.nodeValue };
          saved.push(rec);
        }
        // 正規化キーは原文（全角スペース等を含む）にそのまま一致しないため、
        // 空白を任意の空白列にマッチさせる正規表現で置換する
        node.nodeValue = rec.orig.replace(buildRe(key), function () { return I18N_EN[key]; });
      });
    } else {
      // 日本語復元: 過去に翻訳したノードをすべて原文へ戻す
      saved.forEach(function (r) { r.node.nodeValue = r.orig; });
    }

    // 2) 属性（data-i18n-attr / data-i18n-attr-2 / data-i18n-attr-3）
    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    Array.prototype.forEach.call(attrEls, function (el) {
      ['', '-2', '-3'].forEach(function (suffix) {
        var jp = el.getAttribute('data-i18n-attr' + suffix);
        var attrName = el.getAttribute('data-i18n-attr-name' + suffix);
        if (!jp || !attrName) return;
        var origKey = 'data-i18n-attr-orig' + suffix;
        var orig = el.getAttribute(origKey);
        if (orig === null) {
          orig = el.getAttribute(attrName) || '';
          el.setAttribute(origKey, orig);
        }
        var enVal = I18N_EN[jp];
        el.setAttribute(attrName, en ? (enVal || orig) : orig);
      });
    });

    // 3) html lang / lang-en class
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('lang-en', en);
    // ※ <title> はテキストノードとして 1) で翻訳・復元される。
    //    document.title への代入は title 要素の textContent を差し替えるため
    //    保存済みノードが切り離され、日本語復元が効かなくなる。代入しない。

    // 4) トグルUI状態
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      var opts = btn.querySelectorAll('.lang-opt');
      Array.prototype.forEach.call(opts, function (o) {
        o.classList.toggle('is-active', o.getAttribute('data-lang') === lang);
      });
      btn.setAttribute('aria-pressed', en ? 'false' : 'true');
    }

    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* プライベートモード等は無視 */ }
  }

  /* ── トグル初期化 ── */
  function initLangToggle() {
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var current = document.documentElement.lang === 'en' ? 'ja' : 'en';
      // トグルは ja ⇄ en を交互に切替
      applyLang(current);
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });

    var savedLang = 'ja';
    try { savedLang = localStorage.getItem(STORE_KEY) || 'ja'; } catch (e) { /* ignore */ }
    if (savedLang === 'en') applyLang('en');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangToggle);
  } else {
    initLangToggle();
  }
})();
