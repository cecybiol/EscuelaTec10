// Carga una lista de datos desde un archivo JSON o desde Firestore.
async function cargarDatos({ origen, recurso, db, firestore } = {}) {
  if (!recurso || typeof recurso !== 'string') {
    throw new Error('Indicá la ruta del JSON o el nombre de la colección.');
  }

  if (origen === 'json') {
    const respuesta = await fetch(recurso);

    if (!respuesta.ok) {
      throw new Error(
        `Error al cargar ${recurso}: HTTP ${respuesta.status}`
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error('Se esperaba una lista de registros en el JSON.');
    }

    return datos;
  }

  if (origen === 'firestore') {
    if (
      !db ||
      !firestore ||
      typeof firestore.collection !== 'function' ||
      typeof firestore.getDocs !== 'function'
    ) {
      throw new Error(
        'Configurá db y las funciones collection/getDocs de Firebase.'
      );
    }

    const consulta = await firestore.getDocs(
      firestore.collection(db, recurso)
    );

    return consulta.docs.map(documento => ({
      ...documento.data(),
      id: documento.id
    }));
  }

  throw new Error(`Origen desconocido: ${origen}`);
}