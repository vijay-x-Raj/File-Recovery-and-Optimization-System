"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulator } from "@/lib/context";
import type { DirectoryNode } from "@/lib/fs-simulator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Info,
} from "lucide-react";

function TreeNodeComponent({
  node,
  onSelect,
  selected,
}: {
  node: DirectoryNode;
  onSelect: (n: DirectoryNode) => void;
  selected: string | null;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-all duration-200 ${
          selected === node.id
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
        onClick={() => {
          onSelect(node);
          if (node.isDirectory) setExpanded(!expanded);
        }}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="h-4 w-4 text-blue-500 shrink-0" />
          </>
        )}
        <span className="text-sm font-medium truncate">{node.name}</span>
        {!node.isDirectory && (
          <span className="text-xs text-muted-foreground ml-auto">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>
      <AnimatePresence>
        {expanded && node.isDirectory && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                onSelect={onSelect}
                selected={selected}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DirectoryPage() {
  const { simulator, tick, refresh } = useSimulator();
  const [selectedNode, setSelectedNode] = useState<DirectoryNode | null>(null);

  const tree = useMemo(
    () => simulator.getDirectoryTree(),
    [simulator, tick]
  );

  const allFiles = useMemo(
    () => Array.from(simulator.files.values()),
    [simulator, tick]
  );

  const totalDirs = allFiles.filter((f) => f.isDirectory).length;
  const totalFiles = allFiles.filter((f) => !f.isDirectory).length;

  const handleAddFile = () => {
    const parentId = selectedNode?.isDirectory ? selectedNode.id : "root";
    const name = `new_${Date.now().toString(36)}.dat`;
    simulator.createFile(name, Math.ceil(Math.random() * 5) + 1, parentId, "linked");
    refresh();
  };

  const handleAddDir = () => {
    const parentId = selectedNode?.isDirectory ? selectedNode.id : "root";
    const name = `dir_${Date.now().toString(36)}`;
    simulator.createDirectory(name, parentId);
    refresh();
  };

  const selectedFileEntry = selectedNode
    ? simulator.files.get(selectedNode.id)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Directory Structure
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore the hierarchical file system tree and inode metadata
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-muted-foreground">Directories</p>
            <p className="text-2xl font-bold">{totalDirs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-muted-foreground">Files</p>
            <p className="text-2xl font-bold">{totalFiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-muted-foreground">Max Depth</p>
            <p className="text-2xl font-bold">
              {Math.max(
                ...allFiles
                  .filter((f) => !f.isDirectory)
                  .map((f) => {
                    let depth = 0;
                    let current = f;
                    while (current.parentId) {
                      depth++;
                      current = simulator.files.get(current.parentId)!;
                      if (!current) break;
                    }
                    return depth;
                  }),
                0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Tree */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>File Tree</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAddDir} className="gap-1">
                  <FolderPlus className="h-3.5 w-3.5" /> Dir
                </Button>
                <Button size="sm" onClick={handleAddFile} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> File
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-2 max-h-[500px] overflow-y-auto">
              <TreeNodeComponent
                node={tree}
                onSelect={setSelectedNode}
                selected={selectedNode?.id || null}
              />
            </div>
          </CardContent>
        </Card>

        {/* Details panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Inode Details
            </CardTitle>
            <CardDescription>
              {selectedFileEntry
                ? `Metadata for "${selectedFileEntry.name}"`
                : "Select a file or directory to view its metadata"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFileEntry ? (
              <motion.div
                key={selectedFileEntry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Inode</span>
                  <span className="font-mono">{selectedFileEntry.inode}</span>

                  <span className="text-muted-foreground">Type</span>
                  <Badge variant={selectedFileEntry.isDirectory ? "default" : "secondary"}>
                    {selectedFileEntry.isDirectory ? "Directory" : "File"}
                  </Badge>

                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selectedFileEntry.name}</span>

                  <span className="text-muted-foreground">Size</span>
                  <span>{(selectedFileEntry.size / 1024).toFixed(1)} KB</span>

                  <span className="text-muted-foreground">Permissions</span>
                  <span className="font-mono text-xs">
                    {selectedFileEntry.permissions}
                  </span>

                  <span className="text-muted-foreground">Created</span>
                  <span className="text-xs">
                    {new Date(selectedFileEntry.createdAt).toLocaleTimeString()}
                  </span>

                  <span className="text-muted-foreground">Modified</span>
                  <span className="text-xs">
                    {new Date(selectedFileEntry.modifiedAt).toLocaleTimeString()}
                  </span>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Allocated Blocks ({selectedFileEntry.blocks.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFileEntry.blocks.map((b, i) => (
                      <motion.div
                        key={b}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Badge variant="outline" className="font-mono text-xs">
                          {b}
                        </Badge>
                      </motion.div>
                    ))}
                    {selectedFileEntry.blocks.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        No blocks (directory)
                      </span>
                    )}
                  </div>
                </div>

                {selectedFileEntry.isDirectory && selectedFileEntry.children && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Children ({selectedFileEntry.children.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedFileEntry.children.map((childId) => {
                          const child = simulator.files.get(childId);
                          return (
                            <Badge key={childId} variant="secondary" className="text-xs">
                              {child?.isDirectory ? "📁" : "📄"} {child?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Click a node in the tree
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
