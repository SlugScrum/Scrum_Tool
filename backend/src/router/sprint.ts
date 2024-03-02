import express from "express";
import { createSprint, editSprint} from '../controllers/sprint';
import { errorWrapper } from '../helpers/errors';
import { isAuthenticated } from "../middleware/index";

export default (router: express.Router) => {
  router.post('/release/:releaseId/sprint', isAuthenticated, errorWrapper(createSprint));
  router.post('/sprint/:sprintId/edit', isAuthenticated, errorWrapper(editSprint));
}
