import express from 'express'
import { update } from 'lodash';
import { 
    getAllProjects, 
    newProject, 
    getProjectMembers,
    addProjectMembers,
    deleteProjectMembers, 
    createProjectSprint, 
    deleteProjectSprint, 
    createProjectRelease, 
    deleteProjectRelease,

} from '../controllers/project_controller'
import { isAuthenticated, isOwner } from '../middleware';

export default (router:express.Router)=>{
    router.get('/projects',isAuthenticated, getAllProjects);
    router.delete('/projects/memebers/:id',isAuthenticated, isOwner, deleteProjectMembers);
}