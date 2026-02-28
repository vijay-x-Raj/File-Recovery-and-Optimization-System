// ============================================================
// File System Simulator Engine
// ============================================================

export interface DiskBlock {
  id: number;
  status: "free" | "used" | "corrupted" | "reserved";
  fileId: string | null;
  data: string;
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  blocks: number[];
  createdAt: number;
  modifiedAt: number;
  accessedAt: number;
  isDirectory: boolean;
  parentId: string | null;
  children?: string[];
  permissions: string;
  inode: number;
}

export interface DirectoryNode {
  id: string;
  name: string;
  children: DirectoryNode[];
  isDirectory: boolean;
  size: number;
  depth: number;
}

export interface AccessLog {
  timestamp: number;
  operation: "read" | "write" | "delete" | "create" | "recover";
  fileId: string;
  fileName: string;
  blocks: number[];
  seekTime: number;
  transferTime: number;
  totalTime: number;
  success: boolean;
}

export interface DiskStats {
  totalBlocks: number;
  usedBlocks: number;
  freeBlocks: number;
  corruptedBlocks: number;
  fragmentationPercent: number;
  avgSeekTime: number;
  avgTransferTime: number;
}

// Free-space management methods
export type FreeSpaceMethod = "bitmap" | "linked-list" | "grouping" | "counting";

// File allocation methods
export type AllocationMethod = "contiguous" | "linked" | "indexed";

// ============================================================
// Core simulation class
// ============================================================

export class FileSystemSimulator {
  blocks: DiskBlock[];
  files: Map<string, FileEntry>;
  accessLog: AccessLog[];
  totalBlocks: number;
  blockSize: number;
  private nextInode: number;

  constructor(totalBlocks: number = 256, blockSize: number = 4096) {
    this.totalBlocks = totalBlocks;
    this.blockSize = blockSize;
    this.blocks = [];
    this.files = new Map();
    this.accessLog = [];
    this.nextInode = 1;
    this.initializeDisk();
  }

  private initializeDisk() {
    this.blocks = Array.from({ length: this.totalBlocks }, (_, i) => ({
      id: i,
      status: "free" as const,
      fileId: null,
      data: "",
    }));

    // Reserve first 4 blocks for superblock + metadata
    for (let i = 0; i < 4; i++) {
      this.blocks[i].status = "reserved";
    }

    // Create root directory
    const rootId = "root";
    this.files.set(rootId, {
      id: rootId,
      name: "/",
      size: 0,
      blocks: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      isDirectory: true,
      parentId: null,
      children: [],
      permissions: "rwxr-xr-x",
      inode: this.nextInode++,
    });
  }

  // ========== Free Space Management ==========

  getBitmap(): boolean[] {
    return this.blocks.map((b) => b.status === "free");
  }

  getFreeBlocksLinkedList(): number[] {
    const freeBlocks: number[] = [];
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].status === "free") {
        freeBlocks.push(i);
      }
    }
    return freeBlocks;
  }

  getFreeBlocksGrouping(): number[][] {
    const groups: number[][] = [];
    let currentGroup: number[] = [];
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].status === "free") {
        currentGroup.push(i);
        if (currentGroup.length === 8) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  getFreeBlocksCounting(): { start: number; count: number }[] {
    const runs: { start: number; count: number }[] = [];
    let i = 0;
    while (i < this.blocks.length) {
      if (this.blocks[i].status === "free") {
        const start = i;
        while (i < this.blocks.length && this.blocks[i].status === "free") i++;
        runs.push({ start, count: i - start });
      } else {
        i++;
      }
    }
    return runs;
  }

  // ========== File Operations ==========

  createFile(
    name: string,
    sizeInBlocks: number,
    parentId: string = "root",
    method: AllocationMethod = "contiguous"
  ): FileEntry | null {
    const freeBlocks = this.getFreeBlocksLinkedList();
    if (freeBlocks.length < sizeInBlocks) return null;

    let allocatedBlocks: number[] = [];

    switch (method) {
      case "contiguous":
        allocatedBlocks = this.allocateContiguous(sizeInBlocks);
        break;
      case "linked":
        allocatedBlocks = this.allocateLinked(sizeInBlocks);
        break;
      case "indexed":
        allocatedBlocks = this.allocateIndexed(sizeInBlocks);
        break;
    }

    if (allocatedBlocks.length === 0) return null;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const file: FileEntry = {
      id: fileId,
      name,
      size: sizeInBlocks * this.blockSize,
      blocks: allocatedBlocks,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      isDirectory: false,
      parentId,
      permissions: "rw-r--r--",
      inode: this.nextInode++,
    };

    // Mark blocks as used
    for (const blockId of allocatedBlocks) {
      this.blocks[blockId].status = "used";
      this.blocks[blockId].fileId = fileId;
      this.blocks[blockId].data = `[${name}:${blockId}]`;
    }

    this.files.set(fileId, file);

    // Add to parent directory
    const parent = this.files.get(parentId);
    if (parent && parent.children) {
      parent.children.push(fileId);
    }

    // Log access
    const seekTime = this.calculateSeekTime(allocatedBlocks);
    this.accessLog.push({
      timestamp: Date.now(),
      operation: "create",
      fileId,
      fileName: name,
      blocks: allocatedBlocks,
      seekTime,
      transferTime: sizeInBlocks * 0.5,
      totalTime: seekTime + sizeInBlocks * 0.5,
      success: true,
    });

    return file;
  }

  createDirectory(name: string, parentId: string = "root"): FileEntry | null {
    const dirId = `dir_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const dir: FileEntry = {
      id: dirId,
      name,
      size: 0,
      blocks: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      isDirectory: true,
      parentId,
      children: [],
      permissions: "rwxr-xr-x",
      inode: this.nextInode++,
    };

    this.files.set(dirId, dir);
    const parent = this.files.get(parentId);
    if (parent && parent.children) {
      parent.children.push(dirId);
    }
    return dir;
  }

  deleteFile(fileId: string): boolean {
    const file = this.files.get(fileId);
    if (!file || file.isDirectory) return false;

    for (const blockId of file.blocks) {
      this.blocks[blockId].status = "free";
      this.blocks[blockId].fileId = null;
      this.blocks[blockId].data = "";
    }

    // Remove from parent
    const parent = this.files.get(file.parentId || "root");
    if (parent && parent.children) {
      parent.children = parent.children.filter((id) => id !== fileId);
    }

    this.accessLog.push({
      timestamp: Date.now(),
      operation: "delete",
      fileId,
      fileName: file.name,
      blocks: file.blocks,
      seekTime: 0,
      transferTime: 0,
      totalTime: 0.1,
      success: true,
    });

    this.files.delete(fileId);
    return true;
  }

  readFile(fileId: string): AccessLog | null {
    const file = this.files.get(fileId);
    if (!file) return null;

    const seekTime = this.calculateSeekTime(file.blocks);
    const transferTime = file.blocks.length * 0.5;
    const log: AccessLog = {
      timestamp: Date.now(),
      operation: "read",
      fileId,
      fileName: file.name,
      blocks: file.blocks,
      seekTime,
      transferTime,
      totalTime: seekTime + transferTime,
      success: !file.blocks.some((b) => this.blocks[b]?.status === "corrupted"),
    };

    file.accessedAt = Date.now();
    this.accessLog.push(log);
    return log;
  }

  // ========== Allocation Methods ==========

  private allocateContiguous(size: number): number[] {
    for (let i = 4; i <= this.totalBlocks - size; i++) {
      let found = true;
      for (let j = i; j < i + size; j++) {
        if (this.blocks[j].status !== "free") {
          found = false;
          break;
        }
      }
      if (found) {
        return Array.from({ length: size }, (_, k) => i + k);
      }
    }
    return [];
  }

  private allocateLinked(size: number): number[] {
    const blocks: number[] = [];
    for (let i = 4; i < this.totalBlocks && blocks.length < size; i++) {
      if (this.blocks[i].status === "free") {
        blocks.push(i);
      }
    }
    return blocks.length === size ? blocks : [];
  }

  private allocateIndexed(size: number): number[] {
    const freeBlocks = this.getFreeBlocksLinkedList().filter((b) => b >= 4);
    if (freeBlocks.length < size + 1) return []; // +1 for index block
    // First block is the index block
    return freeBlocks.slice(0, size + 1);
  }

  // ========== Disk Crash & Recovery ==========

  simulateCrash(severity: number = 0.1): number[] {
    const corruptedBlocks: number[] = [];
    const usedBlocks = this.blocks
      .filter((b) => b.status === "used")
      .map((b) => b.id);

    const numToCorrupt = Math.max(1, Math.floor(usedBlocks.length * severity));
    const shuffled = [...usedBlocks].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numToCorrupt && i < shuffled.length; i++) {
      this.blocks[shuffled[i]].status = "corrupted";
      corruptedBlocks.push(shuffled[i]);
    }

    return corruptedBlocks;
  }

  recoverCorruptedBlocks(): {
    recovered: number[];
    lost: number[];
    filesAffected: string[];
  } {
    const recovered: number[] = [];
    const lost: number[] = [];
    const filesAffected = new Set<string>();

    for (const block of this.blocks) {
      if (block.status === "corrupted") {
        if (block.fileId) filesAffected.add(block.fileId);

        // 70% recovery chance
        if (Math.random() < 0.7) {
          block.status = "used";
          recovered.push(block.id);

          this.accessLog.push({
            timestamp: Date.now(),
            operation: "recover",
            fileId: block.fileId || "unknown",
            fileName:
              this.files.get(block.fileId || "")?.name || "unknown",
            blocks: [block.id],
            seekTime: 2,
            transferTime: 1,
            totalTime: 3,
            success: true,
          });
        } else {
          // Capture file info before clearing the block
          const lostFileId = block.fileId;
          const lostFileName = lostFileId ? this.files.get(lostFileId)?.name || "unknown" : "unknown";

          block.status = "free";
          block.fileId = null;
          block.data = "";
          lost.push(block.id);

          // Remove this block from the file's block list so references stay consistent
          if (lostFileId) {
            const ownerFile = this.files.get(lostFileId);
            if (ownerFile) {
              ownerFile.blocks = ownerFile.blocks.filter((b) => b !== block.id);
              ownerFile.size = ownerFile.blocks.length * this.blockSize;
            }
          }

          this.accessLog.push({
            timestamp: Date.now(),
            operation: "recover",
            fileId: lostFileId || "unknown",
            fileName: lostFileName,
            blocks: [block.id],
            seekTime: 2,
            transferTime: 1,
            totalTime: 3,
            success: false,
          });
        }
      }
    }

    return {
      recovered,
      lost,
      filesAffected: Array.from(filesAffected),
    };
  }

  // fsck - file system consistency check
  runFsck(): {
    orphanBlocks: number[];
    missingBlocks: number[];
    inconsistentFiles: string[];
  } {
    const referencedBlocks = new Set<number>();
    const inconsistentFiles: string[] = [];

    this.files.forEach((file) => {
      for (const blockId of file.blocks) {
        referencedBlocks.add(blockId);
        if (
          this.blocks[blockId]?.status === "corrupted" ||
          this.blocks[blockId]?.fileId !== file.id
        ) {
          inconsistentFiles.push(file.id);
        }
      }
    });

    const orphanBlocks: number[] = [];
    const missingBlocks: number[] = [];

    this.blocks.forEach((block) => {
      if (block.status === "used" && !referencedBlocks.has(block.id)) {
        orphanBlocks.push(block.id);
      }
    });

    referencedBlocks.forEach((blockId) => {
      if (this.blocks[blockId]?.status === "free") {
        missingBlocks.push(blockId);
      }
    });

    return {
      orphanBlocks,
      missingBlocks,
      inconsistentFiles: [...new Set(inconsistentFiles)],
    };
  }

  // ========== Defragmentation ==========

  defragment(): { moves: { from: number; to: number }[]; timeSaved: number } {
    const moves: { from: number; to: number }[] = [];
    const fileBlocks: { fileId: string; blocks: number[] }[] = [];

    this.files.forEach((file) => {
      if (!file.isDirectory && file.blocks.length > 0) {
        fileBlocks.push({ fileId: file.id, blocks: [...file.blocks] });
      }
    });

    // Sort by first block position
    fileBlocks.sort((a, b) => a.blocks[0] - b.blocks[0]);

    // --- Safe two-phase compaction ---
    // Phase 1: snapshot every used block's data into a buffer so we never
    //          lose data when source and destination ranges overlap.
    const savedBlocks: Map<number, { status: "used" | "corrupted"; fileId: string | null; data: string }> = new Map();
    for (const fb of fileBlocks) {
      for (const blockId of fb.blocks) {
        const b = this.blocks[blockId];
        savedBlocks.set(blockId, { status: b.status as "used" | "corrupted", fileId: b.fileId, data: b.data });
      }
    }

    // Phase 2: clear all non-reserved blocks
    for (let i = 4; i < this.totalBlocks; i++) {
      this.blocks[i] = { id: i, status: "free", fileId: null, data: "" };
    }

    // Phase 3: place each file contiguously starting at block 4
    let nextFree = 4;
    for (const fb of fileBlocks) {
      const file = this.files.get(fb.fileId);
      if (!file) continue;

      const newBlocks: number[] = [];
      for (let i = 0; i < fb.blocks.length; i++) {
        const oldBlock = fb.blocks[i];
        const newBlock = nextFree + i;
        const saved = savedBlocks.get(oldBlock)!;

        this.blocks[newBlock] = {
          id: newBlock,
          status: saved.status,
          fileId: saved.fileId,
          data: saved.data,
        };

        if (oldBlock !== newBlock) {
          moves.push({ from: oldBlock, to: newBlock });
        }
        newBlocks.push(newBlock);
      }

      file.blocks = newBlocks;
      nextFree += fb.blocks.length;
    }

    // Calculate time saved
    const timeSaved = moves.length * 0.8;
    return { moves, timeSaved };
  }

  // ========== Statistics ==========

  getStats(): DiskStats {
    const used = this.blocks.filter((b) => b.status === "used").length;
    const free = this.blocks.filter((b) => b.status === "free").length;
    const corrupted = this.blocks.filter((b) => b.status === "corrupted").length;

    return {
      totalBlocks: this.totalBlocks,
      usedBlocks: used,
      freeBlocks: free,
      corruptedBlocks: corrupted,
      fragmentationPercent: this.calculateFragmentation(),
      avgSeekTime: this.getAvgSeekTime(),
      avgTransferTime: this.getAvgTransferTime(),
    };
  }

  private calculateFragmentation(): number {
    let fragments = 0;
    let totalFiles = 0;

    this.files.forEach((file) => {
      if (!file.isDirectory && file.blocks.length > 1) {
        totalFiles++;
        for (let i = 1; i < file.blocks.length; i++) {
          if (file.blocks[i] !== file.blocks[i - 1] + 1) {
            fragments++;
          }
        }
      }
    });

    if (totalFiles === 0) return 0;
    const maxGaps = Array.from(this.files.values())
      .filter((f) => !f.isDirectory)
      .reduce((sum, f) => sum + Math.max(0, f.blocks.length - 1), 0);
    return maxGaps === 0 ? 0 : Math.round((fragments / maxGaps) * 100);
  }

  private calculateSeekTime(blocks: number[]): number {
    if (blocks.length <= 1) return 1;
    let totalSeek = 0;
    for (let i = 1; i < blocks.length; i++) {
      totalSeek += Math.abs(blocks[i] - blocks[i - 1]) * 0.1;
    }
    return Math.round(totalSeek * 10) / 10;
  }

  private getAvgSeekTime(): number {
    if (this.accessLog.length === 0) return 0;
    const total = this.accessLog.reduce((sum, l) => sum + l.seekTime, 0);
    return Math.round((total / this.accessLog.length) * 100) / 100;
  }

  private getAvgTransferTime(): number {
    if (this.accessLog.length === 0) return 0;
    const total = this.accessLog.reduce((sum, l) => sum + l.transferTime, 0);
    return Math.round((total / this.accessLog.length) * 100) / 100;
  }

  getDirectoryTree(nodeId: string = "root", depth: number = 0): DirectoryNode {
    const entry = this.files.get(nodeId);
    if (!entry) {
      return { id: nodeId, name: "unknown", children: [], isDirectory: false, size: 0, depth };
    }

    const node: DirectoryNode = {
      id: entry.id,
      name: entry.name,
      isDirectory: entry.isDirectory,
      size: entry.size,
      depth,
      children: [],
    };

    if (entry.isDirectory && entry.children) {
      node.children = entry.children.map((childId) =>
        this.getDirectoryTree(childId, depth + 1)
      );
    }

    return node;
  }

  // Generate sample filesystem for demo
  generateSampleFileSystem() {
    // Create directories
    const docs = this.createDirectory("Documents", "root");
    const imgs = this.createDirectory("Images", "root");
    const sys = this.createDirectory("System", "root");
    const logs = this.createDirectory("Logs", "root");

    if (docs) {
      this.createFile("report.pdf", 8, docs.id, "contiguous");
      this.createFile("notes.txt", 2, docs.id, "linked");
      this.createFile("data.csv", 5, docs.id, "indexed");
      this.createFile("thesis.docx", 12, docs.id, "contiguous");
    }

    if (imgs) {
      this.createFile("photo1.jpg", 6, imgs.id, "linked");
      this.createFile("photo2.png", 4, imgs.id, "contiguous");
      this.createFile("banner.svg", 3, imgs.id, "indexed");
    }

    if (sys) {
      this.createFile("kernel.bin", 15, sys.id, "contiguous");
      this.createFile("config.sys", 1, sys.id, "linked");
      this.createFile("drivers.dll", 7, sys.id, "indexed");
    }

    if (logs) {
      this.createFile("access.log", 3, logs.id, "linked");
      this.createFile("error.log", 2, logs.id, "linked");
      this.createFile("system.log", 4, logs.id, "contiguous");
    }

    // Delete some files to create fragmentation
    const allFiles = Array.from(this.files.values()).filter(
      (f) => !f.isDirectory
    );
    if (allFiles.length > 3) {
      this.deleteFile(allFiles[1].id);
      this.deleteFile(allFiles[4].id);
    }

    // Create more files in gaps
    if (docs) {
      this.createFile("resume.pdf", 3, docs.id, "linked");
      this.createFile("budget.xlsx", 4, docs.id, "linked");
    }
  }
}

// Singleton-like helper for client-side use
let _simulator: FileSystemSimulator | null = null;
export function getSimulator(reset: boolean = false): FileSystemSimulator {
  if (!_simulator || reset) {
    _simulator = new FileSystemSimulator(256);
    _simulator.generateSampleFileSystem();
  }
  return _simulator;
}
