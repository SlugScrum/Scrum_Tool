import React, {useState,useEffect}  from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, Paper } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { PieChart } from '@mui/icons-material';
import { Link} from 'react-router-dom';

const drawerWidth = 240;

const Dashboard = ({ isLoggedIn }) => {

  //State hooks for create project
  const [openDialog, setOpenDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectMembers, setNewProjectMembers] = useState('');


  const handleDialogOpen = () => {
    setOpenDialog(true);
  };
  
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  const handleSubmit = async () => {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          
        }),
        credentials: 'include',
      };
  
      const response = await fetch('http://localhost:3001/projects', options);
      console.log(response)
      if (response.status === 200) {
        console.log('New project created successfully!');
        // Optionally, you can fetch the updated list of projects after creating a new one.
        // Update the projectNames state or perform any other necessary actions.
      } else {
        console.error('Failed to create a new project');
      }
      response.json().then(async (result)=>{
        console.log(result)
        const options = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberIds: [newProjectMembers],
            
          }),
          credentials: 'include',
        };
    
        const response = await fetch(`http://localhost:3001/projects/${result._id}/members`, options);
    
        if (response.status === 200) {
          console.log('members added');
          // Optionally, you can fetch the updated list of projects after creating a new one.
          // Update the projectNames state or perform any other necessary actions.
        } else {
          console.error('members not added');
        }

      })
      handleDialogClose();
      // Reset form fields if needed
      setNewProjectName('');
    } catch (error) {
      console.error('Error creating a new project:', error);
    }
    try {
      console.log(newProjectMembers)
     

      
  
      handleDialogClose();
      // Reset form fields if needed
      setNewProjectMembers('');
    } catch (error) {
      console.error('Error creating a new project:', error);
    }
  };
  
  
  


  // Functionality for navigation clicks will need to be implemented
  const [projectNames, setProjectNames] = useState([]);
  const [currentProject, setCurrentProject] = useState({name:"loading"})
  const handleNavClick = (page) => {
    // Logic to handle navigation
    console.log(`Navigate to ${page}`);
  };
  const handleButtonClick = (project)=>{
    setCurrentProject(project)
  }
  useEffect( ()=>{
     try{
      var options = {
        url: `http://localhost:3001/projects`,
        method:'get',
        // headers: {
        //   'Content-Type': 'application/json'
        // }
        credentials:'include'
      }
      fetch(`http://localhost:3001/projects`,options).then((result)=>{
        console.log(result)
        if(result.status == 200){
          console.log(result)
        }
        result.json().then((response)=>{
          console.log(response)
          setProjectNames(response)
          if(response.length> 0){
            setCurrentProject(response[0])
          }else{
            setCurrentProject({name:"You have no projects yet, click Create New Project to make one. "})
          }
        })
      })

    }catch(error){
      console.log(error)
    }

  },[])
  return (
    <>
      <Box display="flex">
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              marginTop: '150px',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Typography variant="h6" sx={{ padding: 2 }}>
            Dashboard
          </Typography>
          <List>
            {projectNames.map((text, index) => (
              <ListItem button key={text.name}  onClick = {()=>handleButtonClick(text)} > 
                <ListItemText primary={text.name} />
              </ListItem>
            ))}
          </List>
          <Button sx={{ margin: 2 }} variant="contained" color="primary" onClick={handleDialogOpen}>
            Create New Project
          </Button>

        </Drawer>
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', padding: 3, marginTop: '50px' }}
        >
          <Typography variant="h5" gutterBottom>
            {currentProject.name}
          </Typography>
          {/* Insert additional layout here similar to the example provided */}
          <Paper sx={{ padding: 2, margin: '10px 0' }}>
            {/* This is where you'd render your charts and other content */}
            <PieChart />
            <Typography variant="body1">
              Pie Graph of Completed Tasks vs Incomplete
            </Typography>
          </Paper>
          {/* <Button variant="contained" color="secondary">
            <Link to = {{path :'/releases', state:{projectId:currentProject.projectId}}}> View Release Plan </Link>
          </Button> */}

            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/releases"
              state={{ currentProject }}
            >
              View Release Plan
            </Button>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleDialogClose}>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="project-name"
          label="Project Name"
          type="text"
          fullWidth
          variant="standard"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <TextField
          margin="dense"
          id="project-members"
          label="Add Members"
          type="text"
          fullWidth
          variant="standard"
          value={newProjectMembers}
          onChange={(e) => setNewProjectMembers(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Create</Button>
      </DialogActions>
    </Dialog>

    </>
  );
};

export default Dashboard;