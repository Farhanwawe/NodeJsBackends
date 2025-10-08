module.exports = (sequelize, type) => {
    return sequelize.define('comments', {
      id: {
        type: type.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      TicketId: type.INTEGER,
      tag: type.STRING, 
      comment: type.STRING,
      userId: type.INTEGER,
      userName: type.STRING,
      role: type.STRING,
      Timestamp: type.DATE
    },{
        Timestamps:true
    })
  };