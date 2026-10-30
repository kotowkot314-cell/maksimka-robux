const screenEl = document.getElementById('screen');
const logEl = document.getElementById('log');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnReset = document.getElementById('btnReset');
const isoInput = document.getElementById('isoInput');

let emulator = null;
let customIso = null;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logEl.textContent += `[${t}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function clearPlaceholder() {
  const ph = screenEl.querySelector('.placeholder');
  if (ph) ph.remove();
}

function buildConfig(imageSource) {
  return {
    wasm_path: 'https://copy.sh/v86/build/v86.wasm',
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 8 * 1024 * 1024,
    screen_container: screenEl,
    bios: { url: 'https://copy.sh/v86/bios/seabios.bin' },
    vga_bios: { url: 'https://copy.sh/v86/bios/vgabios.bin' },
    cdrom: imageSource,
    autostart: true,
  };
}

function startEmulator(imageSource) {
  if (emulator) return;
  clearPlaceholder();
  
  // Исправляем undefined в логе
  let name = typeof imageSource === 'string' ? imageSource : (imageSource.name || 'локальный образ');
  log(`Запуск эмулятора с образом: ${name}`);

  emulator = new V86(buildConfig(imageSource));

  emulator.add_listener('emulator-ready', () => log('Эмулятор готов.'));
  emulator.add_listener('emulator-started', () => log('Загрузка ОС пошла.'));
  emulator.add_listener('emulator-stopped', () => log('Эмулятор остановлен.'));

  btnStart.disabled = true;
  btnStop.disabled = false;
  btnReset.disabled = false;
}

function stopEmulator() {
  if (!emulator) return;
  try { emulator.stop(); } catch (e) {}
  emulator.destroy();
  emulator = null;
  log('Эмулятор уничтожен.');
  btnStart.disabled = false;
  btnStop.disabled = true;
  btnReset.disabled = true;
}

btnStart.addEventListener('click', () => {
  if (customIso) {
    startEmulator(customIso);
  } else {
    log('⚠️ Файл не выбран. Пожалуйста, нажмите "Загрузить ISO" или убедитесь, что images/hixrinux.iso существует.');
  }
});

btnStop.addEventListener('click', stopEmulator);

btnReset.addEventListener('click', () => {
  stopEmulator();
  setTimeout(() => {
    if (customIso) startEmulator(customIso);
  }, 300);
});

isoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Сохраняем и буфер, и имя для логов
  customIso = { buffer: await file.arrayBuffer(), name: file.name };
  log(`Загружен локальный образ: ${file.name} (${(file.size/1024/1024).toFixed(2)} МБ)`);
  
  // Автоматический запуск после выбора файла (если эмулятор уже работает - перезапускаем)
  if (emulator) {
    stopEmulator();
    setTimeout(() => startEmulator(customIso), 300);
  }
});