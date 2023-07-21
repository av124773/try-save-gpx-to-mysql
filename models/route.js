'use strict';
module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define('Route', {
    gpx: DataTypes.JSON,
    str_gpx: DataTypes.STRING
  }, {});
  Route.associate = function(models) {
    // associations can be defined here
  };
  return Route;
};