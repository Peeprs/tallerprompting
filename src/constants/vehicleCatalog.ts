// Actor: RECEPCIONISTA y ADMINISTRADOR registran vehiculos.
// Catalogo de marcas y modelos. Tecnica: constante centralizada, sin hardcodear en formularios.
export const vehicleCatalog: Record<string, string[]> = {
  Nissan: ['Versa', 'Sentra', 'March', 'NP300', 'Urvan'],
  Chevrolet: ['Aveo', 'Onix', 'Silverado', 'Tracker', 'Express'],
  Volkswagen: ['Vento', 'Virtus', 'Saveiro', 'Crafter', 'Transporter'],
  Toyota: ['Yaris', 'Corolla', 'Hilux', 'Hiace', 'Avanza'],
  Ford: ['Figo', 'Ranger', 'Transit', 'F-150', 'Explorer'],
  Honda: ['City', 'Civic', 'CR-V', 'Odyssey', 'HR-V']
};

// Marcas ordenadas. Actor: sistema. Tecnica: lista derivada del catalogo.
export const vehicleBrands = Object.keys(vehicleCatalog).sort();
