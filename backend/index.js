const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_ID = "teja_24042004"; // yourname_ddmmyyyy
const EMAIL_ID = "teja@srmap.edu.in";
const ROLL_NUMBER = "AP23110011322";

const validateEdge = (edge) => {
    const trimmed = edge.trim();
    const regex = /^[A-Z]->[A-Z]$/;
    if (!regex.test(trimmed)) return false;
    const [parent, child] = trimmed.split('->');
    if (parent === child) return false; // Self-loop
    return true;
};

app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: "Data must be an array of strings" });
        }

        const invalidEntries = [];
        const validEdges = [];
        const duplicateEdges = new Set();
        const seenEdges = new Set();
        const childToParent = new Map();

        data.forEach(entry => {
            const trimmed = entry.trim();
            if (!validateEdge(trimmed)) {
                invalidEntries.push(trimmed);
                return;
            }

            if (seenEdges.has(trimmed)) {
                duplicateEdges.add(trimmed);
                return;
            }

            const [parent, child] = trimmed.split('->');
            
            // Multi-parent rule: Keep only first parent edge
            // Ignore later ones silently
            if (childToParent.has(child)) {
                return;
            }

            childToParent.set(child, parent);
            validEdges.push({ parent, child });
            seenEdges.add(trimmed);
        });

        // Build Graph
        const adj = {};
        const nodes = new Set();
        validEdges.forEach(({ parent, child }) => {
            if (!adj[parent]) adj[parent] = [];
            adj[parent].push(child);
            nodes.add(parent);
            nodes.add(child);
        });

        // Find weakly connected components (Groups)
        // Using undirected adjacency for connecting components
        const undirectedAdj = {};
        nodes.forEach(node => {
            if (!undirectedAdj[node]) undirectedAdj[node] = [];
        });
        validEdges.forEach(({ parent, child }) => {
            undirectedAdj[parent].push(child);
            undirectedAdj[child].push(parent);
        });

        const visited = new Set();
        const groups = [];

        nodes.forEach(node => {
            if (!visited.has(node)) {
                const group = [];
                const queue = [node];
                visited.add(node);
                while (queue.length > 0) {
                    const u = queue.shift();
                    group.push(u);
                    undirectedAdj[u].forEach(v => {
                        if (!visited.has(v)) {
                            visited.add(v);
                            queue.push(v);
                        }
                    });
                }
                groups.push(group);
            }
        });

        const hierarchies = [];
        let totalTrees = 0;
        let totalCycles = 0;
        let largestTreeRoot = "";
        let maxDepth = -1;

        groups.forEach(group => {
            // Find root(s) in this group
            // Root = node with no parent in validEdges
            const rootsInGroup = group.filter(node => !childToParent.has(node));
            
            let root;
            if (rootsInGroup.length === 0) {
                // Pure cycle group: lexicographically smallest
                root = group.sort()[0];
            } else {
                // If multiple roots (shouldn't happen with multi-parent rule in a single weakly connected component? 
                // Wait, if it's A->B, C->B then they are in one component but C->B was ignored.
                // If they are separate like A->B and C->D, they are separate groups.
                // With multi-parent rule, each group should have exactly one root OR zero roots (cycle).
                root = rootsInGroup.sort()[0];
            }

            // Cycle Detection (DFS)
            const groupCycleVisited = new Set();
            const recStack = new Set();
            let hasCycle = false;

            const checkCycle = (u) => {
                groupCycleVisited.add(u);
                recStack.add(u);
                const children = adj[u] || [];
                for (const v of children) {
                    if (!groupCycleVisited.has(v)) {
                        if (checkCycle(v)) return true;
                    } else if (recStack.has(v)) {
                        return true;
                    }
                }
                recStack.delete(u);
                return false;
            };

            // In a weakly connected group, there might be multiple potential traversal paths.
            // Check cycle from every node in the group to be sure.
            for (const node of group) {
                if (!groupCycleVisited.has(node)) {
                    if (checkCycle(node)) {
                        hasCycle = true;
                        break;
                    }
                }
            }

            if (hasCycle) {
                totalCycles++;
                hierarchies.push({
                    root: root,
                    tree: {},
                    has_cycle: true
                });
            } else {
                totalTrees++;
                
                // Build Tree JSON
                const buildTreeJson = (u) => {
                    const res = {};
                    const children = adj[u] || [];
                    children.sort().forEach(v => {
                        res[v] = buildTreeJson(v);
                    });
                    return res;
                };

                const treeJson = {};
                treeJson[root] = buildTreeJson(root);

                // Calculate Depth
                const getDepth = (u) => {
                    const children = adj[u] || [];
                    if (children.length === 0) return 1;
                    let maxSubDepth = 0;
                    children.forEach(v => {
                        maxSubDepth = Math.max(maxSubDepth, getDepth(v));
                    });
                    return 1 + maxSubDepth;
                };

                const depth = getDepth(root);
                
                hierarchies.push({
                    root: root,
                    tree: treeJson,
                    depth: depth
                });

                if (depth > maxDepth) {
                    maxDepth = depth;
                    largestTreeRoot = root;
                } else if (depth === maxDepth) {
                    if (!largestTreeRoot || root < largestTreeRoot) {
                        largestTreeRoot = root;
                    }
                }
            }
        });

        // Lexicographical sort of hierarchies by root
        hierarchies.sort((a, b) => a.root.localeCompare(b.root));

        res.json({
            user_id: USER_ID,
            email_id: EMAIL_ID,
            college_roll_number: ROLL_NUMBER,
            hierarchies,
            invalid_entries: invalidEntries,
            duplicate_edges: Array.from(duplicateEdges),
            summary: {
                total_trees: totalTrees,
                total_cycles: totalCycles,
                largest_tree_root: largestTreeRoot
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
