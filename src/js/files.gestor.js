export class FilesGestorEmpenhos {
  dirHandle = null;
  filesHandles = [];

  async setup() {
    if (!this._verifyApiSupport()) {
      return;
    }
  }

  async saveEmpenhoPDF(empenho, empenhoPDF) {
    if (!this.dirHandle) {
      alert("Nenhum diretório selecionado. Selecione um diretório.");
      return null;
    }

    const fileName = `${empenho.empenho} - ${empenho.parcela}.pdf`;
    const subDir = "empenhos";

    const dirHandle = await this.dirHandle.getDirectoryHandle(subDir, {
      create: true,
    });

    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    });

    console.log("Salvando novo arquivo PDF: ", fileName);

    const writable = await fileHandle.createWritable();
    await writable.write(empenhoPDF);
    await writable.close();

    return true;
  }

  totalPDFcount() {
    if (!this.filesHandles || this.filesHandles.length === 0) {
      return 0;
    }
    return this.filesHandles.length;
  }

  hasMoreFiles() {
    if (!this.filesHandles || this.filesHandles.length === 0) {
      return false;
    }
    return true;
  }

  async getOnePdf() {
    if (!this.filesHandles || this.filesHandles.length === 0) {
      return null;
    }
    const pdfHandle = this.filesHandles.shift();

    return pdfHandle;
  }

  async selectFiles() {
    this.filesHandles = await this._pickDir();
    if (!this.filesHandles) {
      return null;
    }

    console.log("Arquivos PDF encontrados na pasta: ", this.filesHandles);

    return this.filesHandles.length;
  }

  _verifyApiSupport() {
    if (!window.showDirectoryPicker) {
      alert("Não é possível usar o File System Access API neste navegador.");
      return false;
    }
    return true;
  }

  async _pickDir() {
    this.dirHandle = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });

    if (!this.dirHandle) {
      return null;
    }

    const pdfFiles = [];
    for await (const [name, handle] of this.dirHandle.entries()) {
      if (handle.kind === "file" && name.endsWith(".pdf")) {
        const file = await handle.getFile();
        pdfFiles.push(file);
      }
    }

    console.log("Arquivos PDF encontrados: ", pdfFiles);

    if (pdfFiles.length === 0) {
      alert("Nenhum arquivo PDF encontrado na pasta selecionada.");
      return null;
    }

    return pdfFiles;
  }
}
