module.exports = (sequelize, type) => {
    return sequelize.define('popupDisplay', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      popupId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'popups',
          key: 'id'
        }
      },
      userId: {
        type: type.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      isCollected: type.BOOLEAN,
      dontAccountcollected: type.BOOLEAN
     
    })
  };