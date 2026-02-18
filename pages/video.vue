<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">🎬 Video Converter</h1>
      <p class="page-subtitle">
        Convert alpha-packed MP4 to WebM VP9 with transparency
      </p>
    </div>

    <!-- Drop Zone -->
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="openFileDialog"
    >
      <div class="drop-zone-icon">🎬</div>
      <div class="drop-zone-text">Drop MP4 files here, or click to browse</div>
      <div class="drop-zone-hint">Side-by-side alpha-packed MP4 files only</div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".mp4,.MP4"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <!-- Queue -->
    <div v-if="queue.length > 0" class="asset-queue">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        "
      >
        <h2 class="card-title">
          {{ queue.length }} video{{ queue.length > 1 ? "s" : "" }} queued
        </h2>
        <div style="display: flex; gap: 10px">
          <button
            class="btn btn-danger btn-sm"
            @click="clearQueue"
            :disabled="isProcessing"
          >
            🗑️ Clear All
          </button>
          <button
            class="btn btn-primary btn-lg"
            @click="processAll"
            :disabled="isProcessing || queue.length === 0"
          >
            <span
              v-if="isProcessing"
              class="spinner"
              style="width: 16px; height: 16px; border-width: 2px"
            ></span>
            {{ isProcessing ? "Processing..." : "⚡ Encode All" }}
          </button>
        </div>
      </div>

      <!-- Video Cards -->
      <div v-for="(item, idx) in queue" :key="item.id" class="asset-card">
        <div class="asset-thumb">🎬</div>

        <div class="asset-info">
          <div class="asset-name">{{ item.originalName }}</div>
          <div class="asset-meta">MP4 · {{ formatSize(item.size) }}</div>

          <!-- Config -->
          <div class="asset-config">
            <div class="form-group" style="margin-bottom: 0">
              <label class="form-label">Output Name</label>
              <input
                v-model="item.outputName"
                class="form-input"
                placeholder="e.g. oceanic_reverie"
              />
            </div>

            <div class="form-group" style="margin-bottom: 0">
              <label class="form-label">Alpha Side</label>
              <div class="toggle-group">
                <button
                  class="toggle-option"
                  :class="{ active: item.alphaSide === 'left' }"
                  @click="item.alphaSide = 'left'"
                >
                  ◀ Left
                </button>
                <button
                  class="toggle-option"
                  :class="{ active: item.alphaSide === 'right' }"
                  @click="item.alphaSide = 'right'"
                >
                  Right ▶
                </button>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0">
              <label class="checkbox-label">
                <input type="checkbox" v-model="item.invert" />
                Invert alpha matte
              </label>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="item.status !== 'queued'" style="margin-top: 12px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <span class="badge" :class="statusBadge(item.status)">{{
                item.status
              }}</span>
              <span
                v-if="item.log"
                style="
                  font-size: 0.75rem;
                  color: var(--text-muted);
                  cursor: pointer;
                "
                @click="item.showLog = !item.showLog"
              >
                {{ item.showLog ? "Hide" : "Show" }} log
              </span>
            </div>
            <div v-if="item.status === 'processing'" class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: item.progress + '%' }"
              ></div>
            </div>
            <div v-if="item.status === 'processing'" class="progress-text">
              {{ item.progressText || "Encoding..." }}
            </div>
            <div v-if="item.showLog && item.log" class="log-output">
              {{ item.log }}
            </div>
          </div>

          <!-- Preview After Encoding -->
          <div v-if="item.previewUrl" class="preview-section">
            <h3 class="preview-title">📺 Preview</h3>
            <div class="preview-container">
              <video
                :src="item.previewUrl"
                autoplay
                loop
                muted
                playsinline
                class="preview-video"
              ></video>
              <div class="thumb-section">
                <img
                  v-if="item.thumbnailUrl"
                  :src="item.thumbnailUrl"
                  class="preview-thumb"
                  alt="Thumbnail"
                />
                <span class="badge badge-blue" style="font-size: 0.7rem"
                  >Auto-generated</span
                >
              </div>
            </div>

            <!-- Edit & Upload Link -->
            <div class="edit-link-section">
              <NuxtLink
                :to="`/history/video/${item.outputName}`"
                class="btn btn-primary"
              >
                ✏️ Edit & Upload to CDN
              </NuxtLink>
              <span class="form-hint"
                >Configure CDN path, thumbnail, and upload settings on the edit
                page</span
              >
            </div>
          </div>
        </div>

        <!-- Remove Button -->
        <div class="asset-actions">
          <button
            class="btn btn-danger btn-sm"
            @click="removeFromQueue(idx)"
            :disabled="isProcessing"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize, statusBadge } from '~/composables/useFormatters'
interface VideoItem {
  id: number;
  file: File;
  originalName: string;
  size: number;
  outputName: string;
  alphaSide: "left" | "right";
  invert: boolean;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  progress: number;
  progressText: string;
  log: string;
  showLog: boolean;
  previewUrl: string;
  thumbnailUrl: string;
}

const addToast = inject<(type: string, msg: string) => void>("addToast");
const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const isProcessing = ref(false);
const queue = ref<VideoItem[]>([]);

const openFileDialog = () => fileInput.value?.click();

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) addFiles(Array.from(input.files));
  input.value = "";
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
};

const addFiles = (files: File[]) => {
  let added = 0;
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "mp4") {
      addToast?.("error", `Only MP4 files accepted. Got: .${ext}`);
      continue;
    }
    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    queue.value.push({
      id: Date.now() + Math.random(),
      file,
      originalName: file.name,
      size: file.size,
      outputName: baseName,
      alphaSide: "right",
      invert: false,
      status: "queued",
      progress: 0,
      progressText: "",
      log: "",
      showLog: false,
      previewUrl: "",
      thumbnailUrl: "",
    });
    added++;
  }
  if (added) addToast?.("info", `${added} video(s) added`);
};

const removeFromQueue = (idx: number) => queue.value.splice(idx, 1);
const clearQueue = () => {
  queue.value = [];
};



const processAll = async () => {
  isProcessing.value = true;
  for (const item of queue.value) {
    if (item.status === "done") continue;
    try {
      // Step 1: Upload to server
      item.status = "uploading";
      item.progress = 10;
      item.progressText = "Uploading to server...";

      const formData = new FormData();
      formData.append("file", item.file);

      const uploadRes = await $fetch<{
        success: boolean;
        filename: string;
        error?: string;
      }>("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.success)
        throw new Error(uploadRes.error || "Upload failed");

      // Step 2: Encode WebM
      item.status = "processing";
      item.progress = 30;
      item.progressText = "Encoding WebM VP9 + alpha...";

      const processRes = await $fetch<{
        success: boolean;
        log?: string;
        error?: string;
        webm?: string;
        thumbnail?: string;
      }>("/api/process", {
        method: "POST",
        body: {
          filename: uploadRes.filename,
          outputName: item.outputName,
          alphaSide: item.alphaSide,
          invert: item.invert,
          type: "mp4",
        },
      });

      item.log = processRes.log || "";
      item.progress = 90;

      if (!processRes.success)
        throw new Error(processRes.error || "Encoding failed");

      const encodedName = encodeURIComponent(item.outputName);
      item.previewUrl = `/api/preview/webm/${encodedName}/playable.webm`;
      item.thumbnailUrl = `/api/preview/webm/${encodedName}/thumbnail.png`;
      item.progress = 100;
      item.progressText = "Encoding complete!";
      item.status = "done";

      // Step 4: Auto-register in manifest
      try {
        await $fetch("/api/register-asset", {
          method: "POST",
          body: { name: item.outputName, assetType: "video" },
        });
      } catch {
        /* non-critical */
      }

      addToast?.("success", `${item.outputName} encoded successfully!`);
    } catch (err: any) {
      item.status = "error";
      item.progressText = err.message || "Unknown error";
      item.log += "\n\nError: " + (err.message || "Unknown");
      addToast?.("error", `Failed: ${item.outputName} — ${err.message}`);
    }
  }
  isProcessing.value = false;
};
</script>

<style scoped>
.preview-section {
  margin-top: 16px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.preview-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.preview-video {
  max-width: 320px;
  max-height: 240px;
  border-radius: var(--radius-md);
  background: repeating-conic-gradient(#1a1a2e 0% 25%, #16162a 0% 50%) 50% /
    20px 20px;
}

.thumb-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-thumb {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
}

.edit-link-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md);
}

.form-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
