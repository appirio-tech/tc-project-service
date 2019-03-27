/* eslint-disable no-trailing-spaces */
/**
 * API to add a project type
 */
import config from 'config';
import validate from 'express-validation';
import _ from 'lodash';
import Joi from 'joi';
import { middleware as tcMiddleware } from 'tc-core-library-js';
import util from '../../../util';
import models from '../../../models';

const permissions = tcMiddleware.permissions;

const schema = {
  params: {
    version: Joi.number().integer().positive().required(),
    key: Joi.string().max(45).required(),
  },
  body: {
    param: Joi.object().keys({
      phases: Joi.object().required(),

      createdAt: Joi.any().strip(),
      updatedAt: Joi.any().strip(),
      deletedAt: Joi.any().strip(),
      createdBy: Joi.any().strip(),
      updatedBy: Joi.any().strip(),
      deletedBy: Joi.any().strip(),
    }).required(),
  },
};

module.exports = [
  validate(schema),
  permissions('planConfig.create'),
  (req, res, next) => {
    models.sequelize.transaction(() => models.PlanConfig.findAll({
      where: {
        key: req.params.key,
        version: req.params.version,
      },
      order: [['revision', 'DESC']],
    }).then((planConfigs) => {
      if (planConfigs.length >= config.get('MAX_REVISION_NUMBER')) {
        return models.PlanConfig.deleteOldestRevision(req.authUser.userId, req.params.key, req.params.version)
          .then(() => Promise.resolve(planConfigs[0]));
      } else if (planConfigs.length === 0) {
        const apiErr = new Error(`PlanConfig not found for key ${req.params.key} version ${req.params.version}`);
        apiErr.status = 404;
        return Promise.reject(apiErr);
      }
      return Promise.resolve(planConfigs[0]);
    })
    .then((planConfig) => {
      const revisison = planConfig.revision + 1;
      const entity = {
        version: req.params.version,
        revision: revisison,
        createdBy: req.authUser.userId,
        updatedBy: req.authUser.userId,
        key: req.params.key,
        phases: req.body.param.phases,
      };
      return models.PlanConfig.create(entity);
    })
    .then((createdEntity) => {
      // Omit deletedAt, deletedBy
      res.status(201).json(util.wrapResponse(
        req.id, _.omit(createdEntity.toJSON(), 'deletedAt', 'deletedBy'), 1, 201));
    })
    .catch(next));
  },
];
