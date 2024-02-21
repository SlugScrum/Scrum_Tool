import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm"
import { Project } from "./project"
import { getMaybeUndefined, addMaybeUndefined, removeMaybeUndefined } from "./utils/addGetList"
import { TodoItem } from "./todo"

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column()
    email: string

	// Authentication
    @Column({select: false})
	password: string
	@Column({select: false})
	salt: string
    @Column({select: false})
	sessionToken: string

	///// Relational /////
	
	@OneToMany(() => Project, (project) => project.productOwner)
	ownedProjects: Project[]
	
	@ManyToMany(() => Project, (project) => project.teamMembers)
	@JoinTable()
	joinedProjects: Project[]

	@ManyToMany(() => TodoItem, (todo) => todo.assignees)
	assignments: TodoItem[]
	
	///// Methods /////
	
	getOwnedProjects(): Project[] {
		return getMaybeUndefined(this.ownedProjects)
	}
	addOwnedProject(proj: Project): void {
		this.ownedProjects = addMaybeUndefined(proj, this.ownedProjects)
	}
	removeOwnedProject(proj: Project): void {
		this.ownedProjects = removeMaybeUndefined(proj, this.ownedProjects)
	}

	getJoinedProjects(): Project[] {
		return getMaybeUndefined(this.joinedProjects)
	}
	addJoinedProject(proj: Project): void {
		this.joinedProjects = addMaybeUndefined(proj, this.joinedProjects)
	}
	removeJoinedProject(proj: Project): void {
		this.joinedProjects = removeMaybeUndefined(proj, this.joinedProjects)
	}
	
}