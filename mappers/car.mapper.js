module.exports = (data) => ({
  id: data._id,
  carModel: data.carModel,
  stateNumber: data.stateNumber,
  vin: data.vin || '',
  chassisNumber: data.chassisNumber || '',
  place: data.place || '',
  yearProduction: data.yearProduction || '',
});
