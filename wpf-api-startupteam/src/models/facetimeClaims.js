module.exports = (sequelize, type) => {
    return sequelize.define('faceTimeClaims', {
        id: {
            type: type.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: type.BIGINT,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        claimedAt: {
            type: type.DATE,
            defaultValue: sequelize.NOW,
        }
    }, {
        timestamps: true,
    });
};