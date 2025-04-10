import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
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
  const flowStart = await prisma.checkList.create({
    data: {
      id: flowStartId,
      name: 'リース契約判定',
      description: 'この契約書がリース契約に該当するかの判断フロー',
      itemType: 'FLOW',
      isConclusion: false,
      checkListSetId: checkListSetId,
      flowData: {
        next_if_yes: 'yes_branch',
        next_if_no: 'no_branch',
        condition_type: 'YES_NO'
      }
    }
  });
  console.log(`フローチャート型チェックリスト項目を作成しました: ${flowStart.name}`);

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
