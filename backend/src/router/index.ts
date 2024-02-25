import express from 'express';
const router = express.Router();
// import authentication  from './authentication';
import user from './user'
import project from './project';
import release from './release';
import role from './role';
import sprint from './sprint';
import todo from './todo';

export default (): express.Router => {
   // authentication(router)
    user(router);
    project(router);
    release(router);
    role(router);
    sprint(router);
    todo(router);

    return router;
}