module.exports = (data) => ({
  id: data._id,
  carModel: data.carModel,
  vin: data.vin,
  stateNumber: data.stateNumber,
  place: data.place || '',
  yearProduction: data.yearProduction || '',
});
