import mongoose, { Document, Schema, Model } from 'mongoose';
import { IStory } from './interfaces/schemas';
import { SprintModel } from './sprint';
import { ReleaseModel } from './release';

const storySchema = new mongoose.Schema({
  sprint_id: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Sprint' },
  description: String,
  notes: String,
  points: Number,
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
});

storySchema.statics.createStory = async function (storyInput: storyInput): Promise<void> {
  try {
    const newStory = new this({
      sprintId: new mongoose.Types.ObjectId(storyInput.sprint_id),
      description: storyInput.description,
      notes: storyInput.notes,
      points: storyInput.points,
      tasks: storyInput.tasks.map((taskId) => new mongoose.Types.ObjectId(taskId)),
    });
    const savedStory = await newStory.save();

    // Add the new release to the project
    await SprintModel.findByIdAndUpdate(
      storyInput.sprint_id,
      { $push: { stories: savedStory._id } },
      { new: true, upsert: false } // upsert:false to avoid creating a new project if it doesn't exist
    );

    console.log('Sprint created and added to the project successfully.', savedStory);
  } catch (error) {
    // Handle errors here
    console.error('Error creating the sprint and adding to the project:', error);
    throw error; // Rethrow the error for further handling if necessary
  }
};

storySchema.statics.addStoryToRelease = async function (storyInput: storyInput): Promise<void> {
  try {
    const newStory = new this({
      sprintId: null,
      description: storyInput.description,
      notes: storyInput.notes,
      points: storyInput.points,
      tasks: storyInput.tasks.map((taskId) => new mongoose.Types.ObjectId(taskId)),
    });
    const savedStory = await newStory.save();

    // Add the new release to the Release
    console.log('releaseId', storyInput.release_id);
    await ReleaseModel.findByIdAndUpdate(
      storyInput.release_id,
      { $push: { stories: savedStory._id } },
      { new: true, upsert: false } // upsert:false to avoid creating a new project if it doesn't exist
    );

    console.log('Sprint created and added to the release successfully.', savedStory);
  } catch (error) {
    // Handle errors here
    console.error('Error creating the sprint and adding to the project:', error);
    throw error; // Rethrow the error for further handling if necessary
  }
};

storySchema.statics.addStoriesToDatabase = async function (stories: storyInput[]) {
  try {
    const createdStories = await this.create(stories) as Document<IStory>[];
    console.log('Stories added to the database:', createdStories);

    // Extract the IDs of the created stories and store them in an array
    const storyIds = createdStories.map((story) => story._id);
    return storyIds;
  } catch (error) {
    console.error('Error adding stories to the database:', error);
    throw error; // Rethrow the error to handle it further if needed
  }
};

export const StoryModel = mongoose.model<IStory, IStoryModel>('Story', storySchema);

interface IStoryModel extends Model<IStory> {
  createStory: (storyInput: storyInput) => Promise<void>;
  addStoryToRelease: (storyInput: storyInput) => Promise<void>;
  addStoriesToDatabase: (stories: storyInput[]) => Promise<any[]>;
}

export interface storyInput {
  sprint_id: string;
  description: string;
  notes: string; // Assuming these are story IDs
  points: Number;
  tasks: string[];
  release_id: string;
}
