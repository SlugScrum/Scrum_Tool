import express from 'express';
import {get, merge} from 'lodash'

import { UserModel } from '../db/user';
declare module 'express' {
    export interface Request {
      userId?: string; // Use the appropriate type for userId
    }
  }

export const isOwner = async (req:express.Request, res: express.Response, next:express.NextFunction) => {
    try{
        const {id } = req.params;
        const currentUserId = get(req,'identity._id') as string;
        if(!currentUserId){
            return res.sendStatus(403);
        }
        if(currentUserId.toString() !== id){
            return res.sendStatus(403);
        }
        next();
    }catch(error){
        console.log(error);
        return res.sendStatus(400);

    }
}

export const isAuthenticated = async (req:express.Request, res: express.Response, next:express.NextFunction) => {
    try{
        const sessionToken = req.cookies['user-auth'];
        console.log(sessionToken)
        if(!sessionToken){
            return res.sendStatus(403);
        }
        const existingUser = await UserModel.getUserBySessionToken(sessionToken);
        if(!existingUser){
            return res.sendStatus(403);
        }
        req.userId = existingUser._id
        merge(req,{identity: existingUser})
        return next();
    }catch(error){
        console.log(error);
        return res.sendStatus(400);

    }
}


export const projectIsOwner = async (req:express.Request, res: express.Response, next:express.NextFunction) => {
    try{
        const {userId } = req.params;
        const currentUserId = get(req,'identity._id') as string;
        if(!currentUserId){
            return res.sendStatus(403);
        }
        if(currentUserId.toString() !== userId){
            return res.sendStatus(403);
        }
        next();
    }catch(error){
        console.log(error);
        return res.sendStatus(400);

    }
}
