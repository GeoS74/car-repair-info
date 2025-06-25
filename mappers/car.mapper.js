module.exports = (data) => ({
  id: data.id,
  carModel: data.carModel,
  vin: data.vin,
  stateNumber: data.stateNumber,
  place: data.place || '',
  yearProduction: data.yearProduction || '',
});
