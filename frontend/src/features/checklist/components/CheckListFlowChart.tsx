import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckListItem } from '../../../types/api';

type CheckListFlowChartProps = {
  items: CheckListItem[];
  selectedItemId?: string;
};

/**
 * チェックリスト項目をフローチャートとして表示するコンポーネント
 */
export default function CheckListFlowChart({ items, selectedItemId }: CheckListFlowChartProps) {
  // フローチャートのノードとエッジを生成
  const { initialNodes, initialEdges } = useMemo(() => {
    return generateFlowChartElements(items, selectedItemId);
  }, [items, selectedItemId]);

  // ノードとエッジの状態管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // レイアウトの設定
  const onLayout = useCallback(() => {
    // 必要に応じてレイアウトを調整する処理を追加
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background color="#f8f8f8" gap={16} />
      </ReactFlow>
    </div>
  );
}

/**
 * チェックリスト項目からフローチャートのノードとエッジを生成する関数
 */
function generateFlowChartElements(items: CheckListItem[], selectedItemId?: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // ルート項目（親を持たない項目）を特定
  const rootItems = items.filter(item => !item.parent_id);
  let startItem = rootItems[0];
  
  // 選択された項目がある場合、それをスタート地点とする
  if (selectedItemId) {
    const selectedItem = items.find(item => item.check_id === selectedItemId);
    if (selectedItem) {
      startItem = selectedItem;
    }
  }
  
  if (!startItem) return { initialNodes: [], initialEdges: [] };
  
  // フローチャートの構築を開始
  const processedIds = new Set<string>();
  const nodePositions: Record<string, { x: number, y: number }> = {};
  
  // 初期位置
  let currentX = 0;
  let currentY = 0;
  const xGap = 250;
  const yGap = 150;
  
  // 再帰的にノードとエッジを構築
  function buildFlowChart(item: CheckListItem, x: number, y: number) {
    if (processedIds.has(item.check_id)) return;
    processedIds.add(item.check_id);
    
    // ノードの位置を記録
    nodePositions[item.check_id] = { x, y };
    
    // ノードを追加
    const isSelected = item.check_id === selectedItemId;
    nodes.push({
      id: item.check_id,
      position: { x, y },
      data: { 
        label: item.name,
        isConclusion: item.is_conclusion,
        isFlow: item.item_type === 'FLOW',
      },
      style: {
        background: isSelected ? '#f0f9ff' : item.is_conclusion ? '#fef3c7' : '#ffffff',
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px',
        width: 200,
      },
    });
    
    // フロー型の場合、次のノードへのエッジを追加
    if (item.item_type === 'FLOW' && item.flow_data) {
      if (item.flow_data.condition_type === 'YES_NO') {
        // YES の場合
        if (item.flow_data.next_if_yes) {
          const nextItem = items.find(i => i.check_id === item.flow_data?.next_if_yes);
          if (nextItem) {
            // 次のノードの位置を計算
            const nextX = x + xGap;
            const nextY = y - yGap / 2;
            
            // エッジを追加
            edges.push({
              id: `${item.check_id}-yes-${nextItem.check_id}`,
              source: item.check_id,
              target: nextItem.check_id,
              label: 'はい',
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: { stroke: '#10b981' },
            });
            
            // 次のノードを処理
            buildFlowChart(nextItem, nextX, nextY);
          }
        }
        
        // NO の場合
        if (item.flow_data.next_if_no) {
          const nextItem = items.find(i => i.check_id === item.flow_data?.next_if_no);
          if (nextItem) {
            // 次のノードの位置を計算
            const nextX = x + xGap;
            const nextY = y + yGap / 2;
            
            // エッジを追加
            edges.push({
              id: `${item.check_id}-no-${nextItem.check_id}`,
              source: item.check_id,
              target: nextItem.check_id,
              label: 'いいえ',
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: { stroke: '#ef4444' },
            });
            
            // 次のノードを処理
            buildFlowChart(nextItem, nextX, nextY);
          }
        }
      } else if (item.flow_data.condition_type === 'MULTI_CHOICE' && item.flow_data.next_options) {
        // 複数選択肢の場合
        const options = Object.entries(item.flow_data.next_options);
        options.forEach(([option, nextId], index) => {
          const nextItem = items.find(i => i.check_id === nextId);
          if (nextItem) {
            // 次のノードの位置を計算
            const nextX = x + xGap;
            const nextY = y + (index - options.length / 2) * yGap;
            
            // エッジを追加
            edges.push({
              id: `${item.check_id}-${option}-${nextItem.check_id}`,
              source: item.check_id,
              target: nextItem.check_id,
              label: option,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            });
            
            // 次のノードを処理
            buildFlowChart(nextItem, nextX, nextY);
          }
        });
      }
    }
  }
  
  // フローチャートの構築を開始
  buildFlowChart(startItem, currentX, currentY);
  
  return {
    initialNodes: nodes,
    initialEdges: edges,
  };
}

// カスタムノードタイプの定義（必要に応じて）
const nodeTypes = {};
