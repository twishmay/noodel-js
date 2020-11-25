/* Module for managing node identity and querying. */

import NoodelState from '../types/NoodelState';
import NodeState from '../types/NodeState';
import { traverseDescendents } from './traverse';

export function generateNodeId(noodel: NoodelState) {
    noodel.r.idCount++;
    return '_' + noodel.r.idCount.toString();
}

/**
 * Register a node and all its descendents.
 */
export function registerNodeSubtree(noodel: NoodelState, subtreeRoot: NodeState) {
    traverseDescendents(subtreeRoot, desc => {
        noodel.r.idMap.set(desc.id, desc);
    }, true);
}

/**
 * Unregister a node and all its descendents.
 */
export function unregisterNodeSubtree(noodel: NoodelState, node: NodeState) {
    traverseDescendents(node, (desc) => {
        noodel.r.idMap.delete(desc.id);
        // detach noodel state in view model, will be used in vm to check whether node is deleted
        (desc.r.vm as any).noodelState = null;
    }, true);
}

export function isIdRegistered(noodel: NoodelState, id: string): boolean {
    return noodel.r.idMap.has(id);
}

export function changeNodeId(noodel: NoodelState, oldId: string, newId: string) {
    let node = noodel.r.idMap.get(oldId);

    node.id = newId;
    noodel.r.idMap.delete(oldId);
    noodel.r.idMap.set(newId, node);
}

export function findNode(noodel: NoodelState, id: string): NodeState {
    return noodel.r.idMap.get(id) || null;
}


export function findNodeByPath(noodel: NoodelState, path: number[]): NodeState {

    let target = noodel.root;

    for (let i = 0; i < path.length; i++) {
        target = target.children[path[i]];
        if (!target) return null;
    }

    return target;
}