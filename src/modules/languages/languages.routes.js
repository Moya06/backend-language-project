'use strict';
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  getLanguagesCtrl, getLevelsCtrl, getLevelCtrl, getModuleCtrl, getActivityCtrl,
} = require('./languages.controller');

const router = Router();

// Public catalogue — still requires auth so unauthenticated users can't scrape content
router.use(authenticate);

// GET /languages
router.get('/', getLanguagesCtrl);

// GET /languages/:code/levels
router.get('/:code/levels', getLevelsCtrl);

// GET /levels/:id  (convenience — singular level)
// GET /modules/:id
// GET /activities/:id
// These are mounted from app.js at their own paths

module.exports = router;

// Separate mini-routers exported for app.js convenience
const levelsRouter = Router();
levelsRouter.use(authenticate);
levelsRouter.get('/:id', getLevelCtrl);

const modulesRouter = Router();
modulesRouter.use(authenticate);
modulesRouter.get('/:id', getModuleCtrl);

const activitiesRouter = Router();
activitiesRouter.use(authenticate);
activitiesRouter.get('/:id', getActivityCtrl);

module.exports.levelsRouter = levelsRouter;
module.exports.modulesRouter = modulesRouter;
module.exports.activitiesRouter = activitiesRouter;
