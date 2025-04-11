/**
 * データベースシードスクリプト
 * 
 * このスクリプトは初期データをデータベースに投入するためのものです。
 * Prismaのseed機能と連携して使用します。
 */

import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('シードデータの投入を開始します...');

  // 既存のデータがあるか確認
  const existingSetCount = await prisma.checkListSet.count();
  if (existingSetCount > 0) {
    console.log('初期データは既に存在します。シードをスキップします。');
    return;
  }

  // チェックリストセットの作成
  const checkListSetId = ulid();
  const checkListSet = await prisma.checkListSet.create({
    data: {
      id: checkListSetId,
      name: '基本契約書チェックリスト',
      description: '契約書の基本的な項目をチェックするためのセット'
    }
  });
  console.log(`チェックリストセットを作成しました: ${checkListSet.name}`);

  // 親チェックリスト項目の作成
  const parentCheckId = ulid();
  const parentCheck = await prisma.checkList.create({
    data: {
      id: parentCheckId,
      name: '基本契約情報の確認',
      description: '契約書の基本的な情報が正しく記載されているかの確認',
      itemType: 'SIMPLE',
      isConclusion: false,
      checkListSetId: checkListSetId
    }
  });
  console.log(`親チェックリスト項目を作成しました: ${parentCheck.name}`);

  // 子チェックリスト項目の作成
  const childCheck1 = await prisma.checkList.create({
    data: {
      id: ulid(),
      name: '契約当事者の記載',
      description: '契約書に両当事者の正式名称が正確に記載されているか',
      parentId: parentCheckId,
      itemType: 'SIMPLE',
      isConclusion: false,
      checkListSetId: checkListSetId
    }
  });
  console.log(`子チェックリスト項目を作成しました: ${childCheck1.name}`);

  const childCheck2 = await prisma.checkList.create({
    data: {
      id: ulid(),
      name: '契約日の記載',
      description: '契約締結日が明記され、両当事者の合意日と一致しているか',
      parentId: parentCheckId,
      itemType: 'SIMPLE',
      isConclusion: false,
      checkListSetId: checkListSetId
    }
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
      name: 'リース契約判定',
      description: 'この契約書がリース契約に該当するかの判断フロー',
      itemType: 'FLOW',
      isConclusion: false,
      checkListSetId: checkListSetId,
      flowData: {
        condition_type: 'YES_NO',
        next_if_yes: yesNodeId,
        next_if_no: noNodeId
      }
    }
  });
  console.log(`フローチャート開始ノードを作成しました: ${flowStart.name}`);

  // Yes分岐の中間ノード
  const yesNode = await prisma.checkList.create({
    data: {
      id: yesNodeId,
      name: '経済的利益の判断',
      description: '顧客が使用期間全体を通じて特定された資産の使用から経済的利益のほとんどすべてを享受する権利を有しているか',
      parentId: flowStartId,
      itemType: 'FLOW',
      isConclusion: false,
      checkListSetId: checkListSetId,
      flowData: {
        condition_type: 'YES_NO',
        next_if_yes: conclusionYesId,
        next_if_no: conclusionNoId
      }
    }
  });
  console.log(`フロー中間ノード(Yes分岐)を作成しました: ${yesNode.name}`);

  // No分岐のノード
  const noNode = await prisma.checkList.create({
    data: {
      id: noNodeId,
      name: '特定資産の確認',
      description: '契約に特定された資産が含まれているか再確認',
      parentId: flowStartId,
      itemType: 'FLOW',
      isConclusion: false,
      checkListSetId: checkListSetId,
      flowData: {
        condition_type: 'YES_NO',
        next_if_yes: yesNodeId,
        next_if_no: conclusionNoId
      }
    }
  });
  console.log(`フロー中間ノード(No分岐)を作成しました: ${noNode.name}`);

  // 結論ノード（リース契約）
  const conclusionYes = await prisma.checkList.create({
    data: {
      id: conclusionYesId,
      name: 'リース契約結論',
      description: '当該契約はリースを含む',
      parentId: flowStartId,
      itemType: 'FLOW',
      isConclusion: true,
      checkListSetId: checkListSetId,
      metaData: {
        document_id: "01HFR0N599QPC0DA14F0V42FE3",
        page_number: 1
      }
    }
  });
  console.log(`フロー結論ノード(リース契約)を作成しました: ${conclusionYes.name}`);

  // 結論ノード（非リース契約）
  const conclusionNo = await prisma.checkList.create({
    data: {
      id: conclusionNoId,
      name: '非リース契約結論',
      description: '当該契約はリースを含まない',
      parentId: flowStartId,
      itemType: 'FLOW',
      isConclusion: true,
      checkListSetId: checkListSetId,
      metaData: {
        document_id: "01HFR0N599QPC0DA14F0V42FE3",
        page_number: 2
      }
    }
  });
  console.log(`フロー結論ノード(非リース契約)を作成しました: ${conclusionNo.name}`);

  // 複数選択肢のフローチャート例
  const multiChoiceFlowId = ulid();
  const customerOptionId = ulid();
  const supplierOptionId = ulid();
  const neitherOptionId = ulid();

  // 複数選択肢のフロー開始ノード
  const multiChoiceFlow = await prisma.checkList.create({
    data: {
      id: multiChoiceFlowId,
      name: '使用方法の指図権',
      description: '使用期間全体を通じて特定された資産の使用方法を指図する権利を有しているのは誰か',
      itemType: 'FLOW',
      isConclusion: false,
      checkListSetId: checkListSetId,
      flowData: {
        condition_type: 'MULTI_CHOICE',
        next_options: {
          customer: customerOptionId,
          supplier: supplierOptionId,
          neither: neitherOptionId
        }
      }
    }
  });
  console.log(`複数選択肢フローノードを作成しました: ${multiChoiceFlow.name}`);

  // 各選択肢の結論ノード
  await prisma.checkList.create({
    data: {
      id: customerOptionId,
      name: '顧客指図権結論',
      description: '顧客が指図権を持つため、リース契約に該当する',
      parentId: multiChoiceFlowId,
      itemType: 'FLOW',
      isConclusion: true,
      checkListSetId: checkListSetId
    }
  });

  await prisma.checkList.create({
    data: {
      id: supplierOptionId,
      name: 'サプライヤー指図権結論',
      description: 'サプライヤーが指図権を持つため、リース契約に該当しない',
      parentId: multiChoiceFlowId,
      itemType: 'FLOW',
      isConclusion: true,
      checkListSetId: checkListSetId
    }
  });

  await prisma.checkList.create({
    data: {
      id: neitherOptionId,
      name: '指図権なし結論',
      description: '指図権が明確でないため、追加確認が必要',
      parentId: multiChoiceFlowId,
      itemType: 'FLOW',
      isConclusion: true,
      checkListSetId: checkListSetId
    }
  });
  console.log(`複数選択肢の結論ノードを作成しました`);

  console.log('シードデータの投入が完了しました');
}

main()
  .catch((e) => {
    console.error('シードデータの投入中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
