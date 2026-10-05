class ItemInventario {
  constructor({ id = null, nombre, categoria = 'General' }) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      throw new Error('El nombre del ítem es obligatorio.');
    }

    this.id = id || Date.now().toString();
    this.nombre = nombre.trim();
    this.categoria = categoria.trim();
  }

  // Método compartido por cualquier ítem del inventario
  obtenerInformacionBase() {
    return `[${this.categoria}] ${this.nombre} (ID: ${this.id})`;
  }
}