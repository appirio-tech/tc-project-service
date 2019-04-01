/* eslint-disable valid-jsdoc */

import _ from 'lodash';
import { PROJECT_STATUS } from '../constants';

module.exports = function defineProject(sequelize, DataTypes) {
  const Project = sequelize.define('Project', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    directProjectId: DataTypes.BIGINT,
    billingAccountId: DataTypes.BIGINT,
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    external: DataTypes.JSON,
    bookmarks: DataTypes.JSON,
    utm: { type: DataTypes.JSON, allowNull: true },
    estimatedPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    actualPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    terms: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [_.values(PROJECT_STATUS)],
      },
    },
    details: { type: DataTypes.JSON },
    challengeEligibility: DataTypes.JSON,
    cancelReason: DataTypes.STRING,
    templateId: DataTypes.BIGINT,
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deletedBy: DataTypes.BIGINT,
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    updatedBy: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'v3' },
    lastActivityAt: { type: DataTypes.DATE, allowNull: false },
    // we use string for `lastActivityUserId` because it comes in Kafka messages payloads
    // and can be not only user id but also `coderbot`, `system` or some kind of autopilot bot id in the future
    lastActivityUserId: { type: DataTypes.STRING, allowNull: false },
  }, {
    tableName: 'projects',
    paranoid: true,
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
    deletedAt: 'deletedAt',
    indexes: [
      { fields: ['createdAt'] },
      { fields: ['name'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['directProjectId'] },
    ],
    classMethods: {
      /**
       * Get direct project id
       * @param id the id of project
       */
      getDirectProjectId(id) {
        return this.findById(id, {
          attributes: ['directProjectId'],
          raw: true,
        })
            .then(res => res.directProjectId);
      },
      associate: (models) => {
        Project.hasMany(models.ProjectMember, { as: 'members', foreignKey: 'projectId' });
        Project.hasMany(models.ProjectAttachment, { as: 'attachments', foreignKey: 'projectId' });
        Project.hasMany(models.ProjectPhase, { as: 'phases', foreignKey: 'projectId' });
        Project.hasMany(models.ProjectMemberInvite, { as: 'memberInvites', foreignKey: 'projectId' });
      },

      /**
       * Search keyword in name, description, details.utm.code (To be deprecated)
       * @param parameters the parameters
       *          - filters: the filters contains keyword
       *          - order: the order
       *          - limit: the limit
       *          - offset: the offset
       *          - attributes: the attributes to get
       * @param log the request log
       * @return the result rows and count
       */
      searchText(parameters, log) {
        // special handling for keyword filter
        let query = '1=1 ';
        const replacements = {};
        if (_.has(parameters.filters, 'id')) {
          if (_.isObject(parameters.filters.id)) {
            if (parameters.filters.id.$in.length === 0) {
              parameters.filters.id.$in.push(-1);
            }
            query += 'AND projects.id IN(:id) ';
            replacements.id = parameters.filters.id.$in;
          } else if (_.isString(parameters.filters.id) || _.isNumber(parameters.filters.id)) {
            query += 'AND id = :id ';
            replacements.id = parameters.filters.id;
          }
        }
        if (_.has(parameters.filters, 'status')) {
          const statusFilter = parameters.filters.status;
          if (_.isObject(statusFilter)) {
            query += 'AND projects.status IN (:status) ';
            replacements.status = statusFilter.$in;
          } else if (_.isString(statusFilter)) {
            query += 'AND projects.status = :status';
            replacements.status = statusFilter;
          }
        }
        if (_.has(parameters.filters, 'type')) {
          query += 'AND projects.type = :type ';
          replacements.type = parameters.filters.type;
        }
        if (_.has(parameters.filters, 'keyword')) {
          query += 'AND projects."projectFullText" ~ lower(:keyword)';
          replacements.keyword = parameters.filters.keyword;
        }

        let joinQuery = '';
        if (_.has(parameters.filters, 'userId') || _.has(parameters.filters, 'email')) {
          query += ` AND (members."userId" = :userId
          OR invites."userId" = :userId
          OR invites."email" = :email) GROUP BY projects.id`;

          joinQuery = `LEFT OUTER JOIN project_members AS members ON projects.id = members."projectId"
          LEFT OUTER JOIN project_member_invites AS invites ON projects.id = invites."projectId"`;

          replacements.userId = parameters.filters.userId;
          replacements.email = parameters.filters.email;
        }

        let attributesStr = _.map(parameters.attributes, attr => `projects."${attr}"`);
        attributesStr = `${attributesStr.join(',')}`;
        const orderStr = `"${parameters.order[0][0]}" ${parameters.order[0][1]}`;

        // select count of projects
        return sequelize.query(`SELECT COUNT(1) FROM projects AS projects
          ${joinQuery}
          WHERE ${query}`,
          { type: sequelize.QueryTypes.SELECT,
            replacements,
            logging: (str) => { log.debug(str); },
            raw: true,
          })
          .then((fcount) => {
            let count = fcount.length;
            if (fcount.length === 1) {
              count = fcount[0].count;
            }

            replacements.limit = parameters.limit;
            replacements.offset = parameters.offset;
            // select project attributes
            return sequelize.query(`SELECT ${attributesStr} FROM projects AS projects
              ${joinQuery}
              WHERE ${query} ORDER BY ` +
              ` projects.${orderStr} LIMIT :limit OFFSET :offset`,
              { type: sequelize.QueryTypes.SELECT,
                replacements,
                logging: (str) => { log.debug(str); },
                raw: true,
              })
              .then(projects => ({ rows: projects, count }));
          });
      },
      findProjectRange(models, startId, endId, fields, raw = true) {
        return this.findAll({
          where: { id: { $between: [startId, endId] } },
          attributes: _.get(fields, 'projects', null),
          raw,
          include: [{
            model: models.ProjectPhase,
            as: 'phases',
            order: [['startDate', 'asc']],
            // where: phasesWhere,
            include: [{
              model: models.PhaseProduct,
              as: 'products',
            }],
          }],
        });
      },
    },
  });

  return Project;
};
