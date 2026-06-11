import { supabase } from './client.js';
import { showToast } from './ui.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadToStorage(file, bucket) {
  if (!ALLOWED.includes(file.type)) throw new Error('Solo JPG, PNG o WEBP permitidos');
  if (file.size > MAX_BYTES) throw new Error('El archivo supera los 5 MB');

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Initializes an upload widget.
 * Returns { getValue, setValue, reset }.
 *
 * Expected HTML inside containerId:
 *   <input type="hidden"  class="upload-hidden" />
 *   <input type="file"    class="upload-file-input" accept="..." />
 *   <div                  class="upload-preview">
 *     <img               class="upload-preview-img" />
 *     <button type="button" class="upload-remove">× Quitar</button>
 *   </div>
 *   <button type="button" class="upload-trigger">↑ Subir foto</button>
 *   <span                class="upload-status">Subiendo…</span>
 */
export function initUploadWidget(containerId, bucket) {
  const container = document.getElementById(containerId);
  if (!container) return { getValue: () => '', setValue: () => {}, reset: () => {} };

  const hiddenInput = container.querySelector('.upload-hidden');
  const fileInput   = container.querySelector('.upload-file-input');
  const preview     = container.querySelector('.upload-preview');
  const previewImg  = container.querySelector('.upload-preview-img');
  const triggerBtn  = container.querySelector('.upload-trigger');
  const removeBtn   = container.querySelector('.upload-remove');
  const statusEl    = container.querySelector('.upload-status');

  triggerBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    triggerBtn.disabled = true;
    statusEl.classList.add('visible');

    try {
      const url = await uploadToStorage(file, bucket);
      hiddenInput.value = url;
      previewImg.src = url;
      preview.classList.add('visible');
      triggerBtn.classList.add('hidden');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      triggerBtn.disabled = false;
      statusEl.classList.remove('visible');
      fileInput.value = '';
    }
  });

  removeBtn.addEventListener('click', () => {
    hiddenInput.value = '';
    previewImg.src = '';
    preview.classList.remove('visible');
    triggerBtn.classList.remove('hidden');
    fileInput.value = '';
  });

  const setValue = (url) => {
    hiddenInput.value = url ?? '';
    if (url) {
      previewImg.src = url;
      preview.classList.add('visible');
      triggerBtn.classList.add('hidden');
    } else {
      previewImg.src = '';
      preview.classList.remove('visible');
      triggerBtn.classList.remove('hidden');
    }
  };

  const reset = () => setValue('');

  return { getValue: () => hiddenInput.value, setValue, reset };
}
