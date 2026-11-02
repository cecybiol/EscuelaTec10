// js/repositorio.js

// Configuración de Firestore
// IMPORTANTE: Asegúrate de inicializar Firebase en tu proyecto antes de usar estas funciones.
const db = typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null;
const COLECCION_HERRAMIENTAS = 'herramientas';

/**
 * Obtiene las herramientas desde Firestore (o localStorage como respaldo local).
 * @returns {Promise<Array>} Lista de objetos de herramientas
 */
async function listarHerramientas() {
  // Si Firestore no está configurado, leemos de storage local
  if (!db) {
    console.warn('Firestore no configurado. Utilizando almacenamiento local (storage.js).');
    return typeof getCollection === 'function' ? getCollection('herramientas') : [];
  }

  try {
    const snapshot = await db.collection(COLECCION_HERRAMIENTAS).get();
    const lista = [];
    
    snapshot.forEach(doc => {
      lista.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return lista;
  } catch (error) {
    console.error('Error al listar herramientas desde Firestore:', error);
    throw new Error('No se pudo cargar el catálogo compartido. Verifique los permisos o conexión.');
  }
}

/**
 * Guarda o actualiza una herramienta en Firestore.
 * @param {Object} datosHerramienta Datos de la herramienta a guardar
 * @returns {Promise<Object>} Herramienta guardada con su ID
 */
async function guardarHerramienta(datosHerramienta) {
  if (!db) {
    if (datosHerramienta.id && typeof updateItem === 'function') {
      return updateItem('herramientas', datosHerramienta.id, datosHerramienta);
    } else if (typeof addItem === 'function') {
      return addItem('herramientas', datosHerramienta);
    }
    return datosHerramienta;
  }

  try {
    const { id, ...payload } = datosHerramienta;

    if (id) {
      // Edición / Actualización de herramienta existente
      await db.collection(COLECCION_HERRAMIENTAS).doc(String(id)).set(payload, { merge: true });
      return { id, ...payload };
    } else {
      // Alta de nueva herramienta
      const docRef = await db.collection(COLECCION_HERRAMIENTAS).add({
        ...payload,
        fechaCreacion: new Date().toISOString()
      });
      return { id: docRef.id, ...payload };
    }
  } catch (error) {
    console.error('Error de escritura en Firestore:', error);
    throw new Error('Operación no autorizada o error al guardar en el repositorio compartido.');
  }
}