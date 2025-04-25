/**
 * データベースシードスクリプト
 *
 * このスクリプトは初期データをデータベースに投入するためのものです。
 * Prismaのseed機能と連携して使用します。
 */

import { PrismaClient, Prisma } from "../../prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("シードデータの投入を開始します...");

  // 既存のデータがあるか確認
  const existingSetCount = await prisma.checkListSet.count();
  if (existingSetCount > 0) {
    console.log("初期データは既に存在します。シードをスキップします。");
    return;
  }

  // 1. 基本契約書チェックリストセットの作成
  const contractCheckListSetId = ulid();
  const contractCheckListSet = await prisma.checkListSet.create({
    data: {
      id: contractCheckListSetId,
      name: "基本契約書チェックリスト",
      description: "契約書の基本的な項目をチェックするためのセット",
    },
  });
  console.log(
    `チェックリストセットを作成しました: ${contractCheckListSet.name}`
  );

  // 親チェックリスト項目の作成
  const parentCheckId = ulid();
  const parentCheck = await prisma.checkList.create({
    data: {
      id: parentCheckId,
      name: "基本契約情報の確認",
      description: "契約書の基本的な情報が正しく記載されているかの確認",
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
    },
  });
  console.log(`親チェックリスト項目を作成しました: ${parentCheck.name}`);

  // 子チェックリスト項目の作成
  const childCheck1 = await prisma.checkList.create({
    data: {
      id: ulid(),
      name: "契約当事者の記載",
      description: "契約書に両当事者の正式名称が正確に記載されているか",
      parentId: parentCheckId,
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
    },
  });
  console.log(`子チェックリスト項目を作成しました: ${childCheck1.name}`);

  const childCheck2 = await prisma.checkList.create({
    data: {
      id: ulid(),
      name: "契約日の記載",
      description: "契約締結日が明記され、両当事者の合意日と一致しているか",
      parentId: parentCheckId,
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
    },
  });
  console.log(`子チェックリスト項目を作成しました: ${childCheck2.name}`);

  // フローチャート型チェックリスト項目の作成
  const flowStartId = ulid();
  const yesNodeId = ulid();
  const noNodeId = ulid();
  const conclusionYesId = ulid();
  const conclusionNoId = ulid();

  // フローの開始ノード
  const flowStart = await prisma.checkList.create({
    data: {
      id: flowStartId,
      name: "リース契約判定",
      description: "この契約書がリース契約に該当するかの判断フロー",
      itemType: "FLOW",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
      flowData: {
        condition_type: "YES_NO",
        next_if_yes: yesNodeId,
        next_if_no: noNodeId,
      },
    },
  });
  console.log(`フローチャート開始ノードを作成しました: ${flowStart.name}`);

  // Yes分岐の中間ノード
  const yesNode = await prisma.checkList.create({
    data: {
      id: yesNodeId,
      name: "経済的利益の判断",
      description:
        "顧客が使用期間全体を通じて特定された資産の使用から経済的利益のほとんどすべてを享受する権利を有しているか",
      parentId: flowStartId,
      itemType: "FLOW",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
      flowData: {
        condition_type: "YES_NO",
        next_if_yes: conclusionYesId,
        next_if_no: conclusionNoId,
      },
    },
  });
  console.log(`フロー中間ノード(Yes分岐)を作成しました: ${yesNode.name}`);

  // No分岐のノード
  const noNode = await prisma.checkList.create({
    data: {
      id: noNodeId,
      name: "特定資産の確認",
      description: "契約に特定された資産が含まれているか再確認",
      parentId: flowStartId,
      itemType: "FLOW",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
      flowData: {
        condition_type: "YES_NO",
        next_if_yes: yesNodeId,
        next_if_no: conclusionNoId,
      },
    },
  });
  console.log(`フロー中間ノード(No分岐)を作成しました: ${noNode.name}`);

  // 結論ノード（リース契約）
  const conclusionYes = await prisma.checkList.create({
    data: {
      id: conclusionYesId,
      name: "リース契約結論",
      description: "当該契約はリースを含む",
      parentId: flowStartId,
      itemType: "FLOW",
      isConclusion: true,
      checkListSetId: contractCheckListSetId,
      metaData: {
        document_id: "01HFR0N599QPC0DA14F0V42FE3",
        page_number: 1,
      },
    },
  });
  console.log(
    `フロー結論ノード(リース契約)を作成しました: ${conclusionYes.name}`
  );

  // 結論ノード（非リース契約）
  const conclusionNo = await prisma.checkList.create({
    data: {
      id: conclusionNoId,
      name: "非リース契約結論",
      description: "当該契約はリースを含まない",
      parentId: flowStartId,
      itemType: "FLOW",
      isConclusion: true,
      checkListSetId: contractCheckListSetId,
      metaData: {
        document_id: "01HFR0N599QPC0DA14F0V42FE3",
        page_number: 2,
      },
    },
  });
  console.log(
    `フロー結論ノード(非リース契約)を作成しました: ${conclusionNo.name}`
  );

  // 複数選択肢のフローチャート例
  const multiChoiceFlowId = ulid();
  const customerOptionId = ulid();
  const supplierOptionId = ulid();
  const neitherOptionId = ulid();

  // 複数選択肢のフロー開始ノード
  const multiChoiceFlow = await prisma.checkList.create({
    data: {
      id: multiChoiceFlowId,
      name: "使用方法の指図権",
      description:
        "使用期間全体を通じて特定された資産の使用方法を指図する権利を有しているのは誰か",
      itemType: "FLOW",
      isConclusion: false,
      checkListSetId: contractCheckListSetId,
      flowData: {
        condition_type: "MULTI_CHOICE",
        next_options: {
          customer: customerOptionId,
          supplier: supplierOptionId,
          neither: neitherOptionId,
        },
      },
    },
  });
  console.log(`複数選択肢フローノードを作成しました: ${multiChoiceFlow.name}`);

  // 各選択肢の結論ノード
  await prisma.checkList.create({
    data: {
      id: customerOptionId,
      name: "顧客指図権結論",
      description: "顧客が指図権を持つため、リース契約に該当する",
      parentId: multiChoiceFlowId,
      itemType: "FLOW",
      isConclusion: true,
      checkListSetId: contractCheckListSetId,
    },
  });

  await prisma.checkList.create({
    data: {
      id: supplierOptionId,
      name: "サプライヤー指図権結論",
      description: "サプライヤーが指図権を持つため、リース契約に該当しない",
      parentId: multiChoiceFlowId,
      itemType: "FLOW",
      isConclusion: true,
      checkListSetId: contractCheckListSetId,
    },
  });

  await prisma.checkList.create({
    data: {
      id: neitherOptionId,
      name: "指図権なし結論",
      description: "指図権が明確でないため、追加確認が必要",
      parentId: multiChoiceFlowId,
      itemType: "FLOW",
      isConclusion: true,
      checkListSetId: contractCheckListSetId,
    },
  });
  console.log(`複数選択肢の結論ノードを作成しました`);

  // 2. 建築確認申請チェックリストの追加
  console.log("建築確認申請チェックリストの作成を開始します...");

  // チェックリストセットの作成
  const buildingCheckListSetId = ulid();
  const buildingCheckListSet = await prisma.checkListSet.create({
    data: {
      id: buildingCheckListSetId,
      name: "建築確認申請チェックリスト",
      description: "建築確認申請書類の審査用チェックリスト",
    },
  });
  console.log(
    `建築確認申請チェックリストセットを作成しました: ${buildingCheckListSet.name}`
  );

  // 親チェックリスト項目の作成
  const applicantInfoId = ulid();
  const buildingOverviewId = ulid();
  const drawingsId = ulid();
  const legalComplianceId = ulid();

  // 申請者情報
  const applicantInfo = await prisma.checkList.create({
    data: {
      id: applicantInfoId,
      name: "申請者情報",
      description: "申請者の基本情報が正しく記載されているかの確認",
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: buildingCheckListSetId,
    },
  });
  console.log(`親チェックリスト項目を作成しました: ${applicantInfo.name}`);

  // 建築物の概要
  const buildingOverview = await prisma.checkList.create({
    data: {
      id: buildingOverviewId,
      name: "建築物の概要",
      description: "建築物の基本情報が正しく記載されているかの確認",
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: buildingCheckListSetId,
    },
  });
  console.log(`親チェックリスト項目を作成しました: ${buildingOverview.name}`);

  // 図面
  const drawings = await prisma.checkList.create({
    data: {
      id: drawingsId,
      name: "図面",
      description: "必要な図面が添付されているかの確認",
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: buildingCheckListSetId,
    },
  });
  console.log(`親チェックリスト項目を作成しました: ${drawings.name}`);

  // 法適合性
  const legalCompliance = await prisma.checkList.create({
    data: {
      id: legalComplianceId,
      name: "法適合性",
      description: "建築基準法などの法規制に適合しているかの確認",
      itemType: "SIMPLE",
      isConclusion: false,
      checkListSetId: buildingCheckListSetId,
    },
  });
  console.log(`親チェックリスト項目を作成しました: ${legalCompliance.name}`);

  // 子チェックリスト項目の作成
  // 申請者情報の子項目
  const applicantChildren = [
    { name: "氏名の記載", description: "申請者の氏名が正確に記載されているか" },
    { name: "住所の記載", description: "申請者の住所が正確に記載されているか" },
    {
      name: "連絡先の記載",
      description: "申請者の連絡先が正確に記載されているか",
    },
  ];

  for (const child of applicantChildren) {
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: child.name,
        description: child.description,
        parentId: applicantInfoId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: buildingCheckListSetId,
      },
    });
    console.log(`子チェックリスト項目を作成しました: ${child.name}`);
  }

  // 建築物の概要の子項目
  const buildingChildren = [
    {
      name: "建築場所の記載",
      description: "建築物の所在地が正確に記載されているか",
    },
    { name: "用途の記載", description: "建築物の用途が正確に記載されているか" },
    { name: "構造の記載", description: "建築物の構造が正確に記載されているか" },
    { name: "階数の記載", description: "建築物の階数が正確に記載されているか" },
  ];

  for (const child of buildingChildren) {
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: child.name,
        description: child.description,
        parentId: buildingOverviewId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: buildingCheckListSetId,
      },
    });
    console.log(`子チェックリスト項目を作成しました: ${child.name}`);
  }

  // 図面の子項目
  const drawingChildren = [
    { name: "配置図の添付", description: "建築物の配置図が添付されているか" },
    { name: "平面図の添付", description: "建築物の平面図が添付されているか" },
    { name: "立面図の添付", description: "建築物の立面図が添付されているか" },
  ];

  for (const child of drawingChildren) {
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: child.name,
        description: child.description,
        parentId: drawingsId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: buildingCheckListSetId,
      },
    });
    console.log(`子チェックリスト項目を作成しました: ${child.name}`);
  }

  // 法適合性の子項目
  const legalChildren = [
    {
      name: "用途地域の適合",
      description: "建築物の用途が用途地域の規制に適合しているか",
    },
    {
      name: "建ぺい率の適合",
      description: "建築物の建ぺい率が規制に適合しているか",
    },
    {
      name: "容積率の適合",
      description: "建築物の容積率が規制に適合しているか",
    },
    {
      name: "高さ制限の適合",
      description: "建築物の高さが規制に適合しているか",
    },
  ];

  for (const child of legalChildren) {
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: child.name,
        description: child.description,
        parentId: legalComplianceId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: buildingCheckListSetId,
      },
    });
    console.log(`子チェックリスト項目を作成しました: ${child.name}`);
  }

  // 結論項目の作成
  const conclusionItems = [
    { name: "申請書類の完全性", description: "申請書類が完全に揃っているか" },
    {
      name: "法規制への適合性",
      description: "建築計画が法規制に適合しているか",
    },
  ];

  for (const item of conclusionItems) {
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: item.name,
        description: item.description,
        itemType: "SIMPLE",
        isConclusion: true,
        checkListSetId: buildingCheckListSetId,
      },
    });
    console.log(`結論チェックリスト項目を作成しました: ${item.name}`);
  }

  // 3. Review関連データの追加
  console.log("Review関連データの作成を開始します...");

  // ReviewDocument（審査対象ドキュメント）の作成
  const reviewDocumentId = ulid();
  const reviewDocument = await prisma.reviewDocument.create({
    data: {
      id: reviewDocumentId,
      filename: "建築確認申請書_サンプル.pdf",
      s3Path: "review-documents/building-application-sample.pdf",
      fileType: "application/pdf",
      uploadDate: new Date(),
      userId: "user123",
      status: "uploaded",
    },
  });
  console.log(`ReviewDocumentを作成しました: ${reviewDocument.filename}`);

  // ReviewJob（審査ジョブ）の作成
  const reviewJobId = ulid();
  const reviewJob = await prisma.reviewJob.create({
    data: {
      id: reviewJobId,
      name: "建築確認申請書審査",
      status: "pending",
      documentId: reviewDocumentId,
      checkListSetId: buildingCheckListSetId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user123",
      metaData: {
        priority: "high",
        notes: "初回審査",
      },
    },
  });
  console.log(`ReviewJobを作成しました: ${reviewJob.name}`);

  // 建築確認申請チェックリストの全項目を取得
  const allBuildingCheckItems = await prisma.checkList.findMany({
    where: {
      checkListSetId: buildingCheckListSetId,
    },
  });

  // ReviewResult（審査結果）の作成をより実践的なデータで強化
  const resultStatuses = ["pass", "fail", "warning", "pending"];
  const confidenceScores = [0.98, 0.85, 0.76, 0.92, 0.65];
  const extractedTexts = [
    "申請者：山田太郎、東京都渋谷区〇〇1-2-3",
    "建築場所：東京都新宿区××4-5-6",
    "用途：事務所兼住宅",
    "構造：鉄筋コンクリート造 地上5階",
    "建築面積：250.5㎡、延床面積：1250.8㎡",
  ];
  const explanations = [
    "申請者情報が正確に記載されています。",
    "必要書類が不足しています。平面図の添付がありません。",
    "容積率計算に誤りがあります。再確認が必要です。",
    "高さ制限に適合しています。",
    "用途地域（第一種住居地域）における事務所床面積の制限を超過している可能性があります。",
  ];

  for (const checkItem of allBuildingCheckItems) {
    // 特定のチェック項目には詳細な結果を設定
    const isCompleted = Math.random() > 0.3; // 70%は完了状態
    const status = isCompleted ? "completed" : "pending";

    // 結果を生成（completedの場合のみ）
    let result = null;
    let confidenceScore = null;
    let explanation = null;
    let extractedText = null;
    let userOverride = false;
    let userComment = null;

    if (isCompleted) {
      result = resultStatuses[Math.floor(Math.random() * 3)]; // pass, fail, warning
      confidenceScore =
        confidenceScores[Math.floor(Math.random() * confidenceScores.length)];

      // 特定のチェック項目には有意義なデータを設定
      if (checkItem.name.includes("氏名") || checkItem.name.includes("住所")) {
        extractedText = extractedTexts[0];
        explanation = explanations[0];
        result = "pass";
      } else if (checkItem.name.includes("平面図")) {
        extractedText = "平面図の添付なし";
        explanation = explanations[1];
        result = "fail";
        // ユーザーによる上書きの例
        userOverride = Math.random() > 0.7;
        if (userOverride) {
          userComment = "確認済み。後日提出予定とのこと。";
        }
      } else if (checkItem.name.includes("容積率")) {
        extractedText = "容積率：250%（許容：200%）";
        explanation = explanations[2];
        result = "warning";
      } else if (Math.random() > 0.7) {
        // その他のアイテムにもランダムでデータを設定
        const randomIndex = Math.floor(Math.random() * extractedTexts.length);
        extractedText = extractedTexts[randomIndex];
        explanation =
          explanations[Math.floor(Math.random() * explanations.length)];
      }
    }

    await prisma.reviewResult.create({
      data: {
        id: ulid(),
        reviewJobId: reviewJobId,
        checkId: checkItem.id,
        status,
        result,
        confidenceScore,
        explanation,
        extractedText,
        userOverride,
        userComment,
        createdAt: new Date(),
        updatedAt: new Date(),
        metaData: isCompleted
          ? {
              processingTime: Math.floor(Math.random() * 5000) + 1000,
              aiModel: "gpt-4-1106-preview",
            }
          : Prisma.JsonNull,
      },
    });
  }
  console.log(
    `ReviewResultを作成しました: ${allBuildingCheckItems.length}件（実際のデータを含む）`
  );

  console.log("シードデータの投入が完了しました");
}

main()
  .catch((e) => {
    console.error("シードデータの投入中にエラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

main()
  .catch((e) => {
    console.error("シードデータの投入中にエラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
