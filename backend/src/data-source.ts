import { User } from "./entity/User"
import { Project } from "./entity/project"
import { Release } from "./entity/release"
import { UserRole } from "./entity/roles"
import { Sprint } from "./entity/sprint"
import { DataSource, EntityTarget, FindManyOptions, FindOptionsWhere, ObjectLiteral, QueryFailedError } from "typeorm"
import { Bug, Epic, Infrastructure, Spike, Story, Task, TodoItem } from "./entity/todo"
import { authentication, random } from "./helpers"
import "reflect-metadata"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    synchronize: true,
    logging: true,
    entities: [User, Project, Release, UserRole, Sprint, TodoItem, Epic, Story, Task, Spike, Infrastructure, Bug],
    subscribers: [],
    migrations: [],
})

export class Database {

	///// Initialization /////

	private static instance: Database;
	private dataSource: DataSource | null = null

	private constructor(dataSource: DataSource) {
		this.initialize(dataSource);
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			throw new Error("Database is not initialized! Use setAndGetInstance first.")
		}
		return Database.instance;
	}

	public static async setAndGetInstance(dataSource: DataSource): Promise<Database> {
		if (!Database.instance) {
			if (!dataSource.isInitialized)
				throw new Error("Database's DataSource is not initialized! Use setAndGetInstance first.")
			Database.instance = new Database(dataSource);
		}
		return Database.instance;
	}

	private initialize(dataSource: DataSource): void {
		try {
			this.dataSource = dataSource;
			console.log('Connected to database');
		} catch (error) {
			console.error('Error connecting to database:', error);
			throw error; // Rethrow the error to notify the caller of the failure
		}
	}

	public get databaseIsInitialized(): boolean {
		return Database.instance != null;
	}

	public get dataSourceIsInitialized(): boolean {
		return this.dataSource != null && this.dataSource.isInitialized;
	}

	///// User Methods /////

	public async createNewUser(username: string, email: string, password: string, salt?: string, sessionToken?: string): Promise<User> {
		const newUser = new User()
		newUser.username = username
		newUser.email = email
		newUser.salt = salt ?? random();
		newUser.password = authentication(newUser.salt, password);
		
		try {
			await this.save(newUser)
		} catch {
			throw new Error("Likely found a duplicate username or email")
		}
		delete newUser.password;

		return newUser
	}

	public async updateUser(id: number, username?: string, email?: string, password?: string, salt?: string, sessionToken?: string): Promise<User> {
		const user = await this.lookupUserById(id)
		user.username = username ?? user.username
		user.email = email ?? user.email
		user.password = password ?? user.password
		user.salt = salt ?? user.salt
		user.sessionToken = sessionToken ?? user.sessionToken

		await this.save(user)
		return user
	}

	// Errors if not found.
	public async lookupUserById(id: number): Promise<User> {
		const maybeUser = await this.dataSource.manager.findOneBy(User, {id: id});
		if (!maybeUser) {
			throw new Error(`User with id ${id} not found`)
		}
		return maybeUser
	}

	// Errors if not found.
	public async lookupUserByEmail(email: string): Promise<User> {
		const maybeUser = await this.dataSource.manager.findOneBy(User, {email: email});
		if (!maybeUser) {
			throw new Error(`User with email ${email} not found`)
		}
		return maybeUser
	}

	public async fetchUserWithProjects(id: number): Promise<User> {
		return (await this.dataSource.getRepository(User).find({where: {id: id}, relations:{ownedProjects: true, joinedProjects: true}}))[0]
	}

	public async joinProject(userId: number, projectId: number): Promise<Project> {
		const user = await this.lookupUserById(userId)
		const project = await this.lookupProjectById(projectId)
		user.addJoinedProject(project)
		project.addTeamMember(user)
		await this.save(user)
		await this.save(project)
		return project
	}

	///// Project Methods /////

	public async createNewProject(userId: number, projectName: string): Promise<Project> {
		const user = await this.lookupUserById(userId)
		const newProject = new Project()
		newProject.name = projectName
		newProject.nextRevision = 1
		newProject.productOwner = user
		user.addOwnedProject(newProject)
		await this.save(user)
		await this.save(newProject)
		return newProject
	}

	public async updateProject(id: number, name?: string,): Promise<Project> {
		const project = await this.lookupProjectById(id)
		project.name = name ?? project.name
		await this.save(project)
		return project
	}

	public async lookupProjectById(id: number): Promise<Project> {
		const maybeProject = await this.dataSource.manager.findOneBy(Project, {id: id});
		if (!maybeProject) {
			throw new Error(`Project with id ${id} not found`)
		}
		return maybeProject
	}

	public async lookupProjectByIdWithUsers(id: number): Promise<Project> {
		const maybeProject =  (await this.dataSource.getRepository(Project).find({where: {id: id}, relations:{productOwner: true, teamMembers: true}}))[0]
		if (!maybeProject) {
			throw new Error(`Project with id ${id} not found`)
		}
		return maybeProject
	}

	public async fetchProjectWithReleases(id: number): Promise<Project> {
		// Get the project with revisions' with only their numbers and dates
		// avoids getting the problem/goal statements and saves on data
		const project = await this.dataSource.getRepository(Project).createQueryBuilder("project")
			.where("project.id = :projectId", {projectId: id})
			.select(['project.id', 'release.revision', "release.revisionDate"])
			.leftJoin('project.releases', 'release')  // releases is the joined table
			.getMany();
		return project[0]
	}

	///// Release Methods /////

	public async createNewRelease(projectId: number, revision?: number, revisionDate?: Date, problemStatement?: string, goalStatement?: string): Promise<Release> {
		const project = await this.lookupProjectById(projectId)
		const release = new Release()
		release.project = project 
		if (!revision) {
			revision = project.nextRevision
			project.nextRevision = project.nextRevision + 1
			console.log(project)
			await this.save(project)
		}
		release.revision = revision
		release.revisionDate = revisionDate ?? new Date()
		release.problemStatement = problemStatement ?? ""
		release.goalStatement = goalStatement ?? ""
		await this.save(release)
		return release
	}

	public async updateRelease(releaseId: number, revisionDate?: Date, problemStatement?: string, goalStatement?: string): Promise<Release> {
		const release = await this.lookupReleaseById(releaseId)
		// const releaseWithProject = await this.lookupReleaseWithProject(releaseId)
		// release.revision = revision ?? release.revision // shouldnt change
		release.revisionDate = revisionDate ?? release.revisionDate
		release.problemStatement = problemStatement ?? release.problemStatement
		release.goalStatement = goalStatement ?? release.goalStatement
		await this.save(release)
		return release
	}

	public async lookupReleaseById(id: number): Promise<Release> {
		const maybeRelease =  await this.dataSource.manager.findOneBy(Release, {id: id});
		if (!maybeRelease) {
			throw new Error(`Release with id ${id} not found`)
		}
		return maybeRelease
	}

	public async lookupReleaseWithProject(releaseId: number): Promise<Release> {
		const releaseWithProject = (await this.dataSource.getRepository(Release).find({
			where: {id: releaseId},
			relations:{
				project: true
			}}))[0]
		if (!releaseWithProject) {
			throw new Error(`Release with releaseId ${releaseId} not found`)
		}
		return releaseWithProject
	}

	/// Copies the columns only, but not the relations. TODO: copy relations
	public async copyRelease(releaseId: number): Promise<Release> {
		const releaseCopy = new Release();
		// need to get the whole list of releases in this project so we can get the new version #
		// should we just make a new variable to count the max version
		const releaseWithProject = await this.lookupReleaseWithProject(releaseId)
		releaseCopy.copy(releaseWithProject)
		releaseCopy.revision = releaseCopy.project.nextRevision;
		releaseCopy.project.nextRevision += 1;
		await this.save(releaseCopy.project)
		await this.save(releaseCopy)
		return releaseCopy
	}

	///// Role Methods /////

	public async createNewRole(userId: number, sprintId: number, role: string): Promise<UserRole> {
		const user = await this.lookupUserById(userId)
		const sprint = await this.lookupSprintById(sprintId)
		const newRole = new UserRole()
		newRole.role = role
		newRole.user = user
		newRole.sprint = sprint
		await this.save(newRole)
		return newRole
	}

	public async updateRole(roleId: number, userId: number, role?: string): Promise<UserRole> {
		const userRole = await this.lookupRoleById(roleId)
		const user = await this.lookupUserById(userId)
		userRole.role = role ?? userRole.role
		userRole.user = user ?? userRole.user // may break if relational not loaded?
		await this.save(userRole)
		return userRole
	}
	
	public async lookupRoleById(id: number): Promise<UserRole> {
		const maybeRole =  await this.dataSource.manager.findOneBy(UserRole, {id: id});
		if (!maybeRole) {
			throw new Error(`Role with id ${id} not found`)
		}
		return maybeRole
	}

	///// Sprint Methods /////
	
	public async createNewSprint(releaseId: number, sprintNumber: number, startDate: Date, endDate: Date, goal: string): Promise<Sprint> {
		const release = await this.lookupReleaseById(releaseId)
		const newSprint = new Sprint()
		newSprint.sprintNumber = sprintNumber
		newSprint.startDate = startDate
		newSprint.endDate = endDate
		newSprint.goal = goal
		newSprint.release = release
		release.addSprint(newSprint)
		await this.save(newSprint)
		return newSprint
	}

	public async updateSprint(sprintId: number, sprintNumber?: number, startDate?: Date, endDate?: Date, goal?: string): Promise<Sprint> {
		const sprint = await this.lookupSprintById(sprintId)
		sprint.sprintNumber = sprintNumber ?? sprint.sprintNumber
		sprint.startDate = startDate ?? sprint.startDate
		sprint.endDate = endDate ?? sprint.endDate
		sprint.goal = goal ?? sprint.goal
		await this.save(sprint)
		return sprint
	}
	
	public async lookupSprintById(id: number): Promise<Sprint> {
		const maybeSprint =  await this.dataSource.manager.findOneBy(Sprint, {id: id});
		if (!maybeSprint) {
			throw new Error(`Sprint with id ${id} not found`)
		}
		return maybeSprint
	}

	///// Todo Methods /////

	// TODO: more methods for stories, tasks, etc
	// Some details TBD because of sponsor saying avoid duplication of data
	public async lookupTODOById(id: number): Promise<TodoItem> {
		const maybeTODO =  await this.dataSource.manager.findOneBy(TodoItem, {id: id});
		if (!maybeTODO) {
			throw new Error(`TODO with id ${id} not found`)
		}
		return maybeTODO
	}

	///// General Methods - Only use if there is not a method above to use /////

	public async save(item: any) {
		return await this.dataSource.manager.save(item);
	}
	
	/// Like save, but guaranteed to not exist in the db
	/// for performance purposes
	/// WARNING: behaves differently than save somehow... doesnt save into original entity?
	public async insert(item: User | Project | Release | UserRole | Sprint | TodoItem) {
		return await this.dataSource.manager.insert(typeof(item), item);
	}

	/// Like save, but guaranteed to already exist in the db
	/// for performance purposes
	/// WARNING: behaves differently than save somehow...
	public async update(item: User | Project | Release | UserRole | Sprint | TodoItem) {
		return await this.dataSource.manager.update(typeof(item), item.id, item);
	}

	public async find(entity: EntityTarget<ObjectLiteral>, findOptions: FindManyOptions<ObjectLiteral>) {
		return await this.dataSource.manager.find(entity, findOptions)
	}

	public async findBy(entity: EntityTarget<ObjectLiteral>, findWhereOptions: FindOptionsWhere<ObjectLiteral> | FindOptionsWhere<ObjectLiteral>[]) {
		return await this.dataSource.manager.findBy(entity, findWhereOptions)
	}

	public async deleteAll(): Promise<void> {
		const loadedReleases = await this.dataSource.getRepository(Release).find({
			relations: ['project', 'sprints', 'backlog'],
		});
		const loadedProjects = await this.dataSource.getRepository(Project).find({
			relations: ['productOwner', 'teamMembers'],
		});
		const loadedUsers = await this.dataSource.getRepository(User).find({
			relations: ['ownedProjects', 'joinedProjects'],
		});
		await this.dataSource.getRepository(UserRole).delete({})
		await this.dataSource.getRepository(TodoItem).delete({})
		await this.dataSource.getRepository(Sprint).delete({})
		for (const release of loadedReleases) { // many2many hard :(
			delete release.project
			release.sprints = []
			release.backlog = []
			await this.dataSource.manager.save(release)
		}
		await this.dataSource.getRepository(Release).delete({})
		for (const project of loadedProjects) { // many2many hard :(
			project.teamMembers = []
			await this.dataSource.manager.save(project)
		}
		for (const user of loadedUsers) {
			user.ownedProjects = []
			user.joinedProjects = []
			await this.dataSource.manager.save(user)
		}
		await this.dataSource.getRepository(Project).delete({})
		await this.dataSource.getRepository(User).delete({})
	}

}
