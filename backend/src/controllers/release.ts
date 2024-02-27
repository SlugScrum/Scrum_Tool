import express from "express";
import { Database } from "../data-source";

export const newRelease = async (req: express.Request, res: express.Response) => {
	const db = Database.getInstance()
	const { projectId } = req.params
	const {
		revision,
		revisionDate,
		problemStatement,
		goalStatement,
	} = req.body
	const release = await db.createNewRelease(parseInt(projectId), revision, revisionDate, problemStatement, goalStatement)
	return res.json(release)
};

export const editRelease = async (req: express.Request, res: express.Response) => {
	const db = Database.getInstance()
	const { releaseId } = req.params
	const {
		revisionDate,
		problemStatement,
		goalStatement,
	} = req.body
	const release = await db.updateRelease(parseInt(releaseId), revisionDate, problemStatement, goalStatement)
	return res.json(release)
};

export const copyRelease = async (req: express.Request, res: express.Response) => {
	const db = Database.getInstance()
	const {releaseId} = req.params;
	try {
		const release = await db.copyRelease(parseInt(releaseId))
		res.json(release)
	} catch {
		res.sendStatus(404) // 404 right?
	}
};