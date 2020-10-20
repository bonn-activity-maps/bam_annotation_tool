# Annotation Tool

TODO: general description of the tool

## Screenshots
#### User 
The tool has a user management system and is therefore protected by a login. This system allows two different types of user:
  - **Annotators**: have access to the datasets that have been assigned to them. They can create, modify and delete annotations.
  - **Superusers**: have access to all the management functionalities of the tool. They can create/modify/delete users, upload/remove datasets, modify the datasets assigned to each user and create real-time notifications for all the users using the tool.

![Login image](https://github.com/Belberus/ThanosDidNothingWrong/blob/develop/images/screenshot2.png)

#### Multiple views of the scene at the same time
The tool allows to have up to 4 camera views simultaneously to interact with. This views can be switched at all times with the ones stored in the views storage panel situated on the right of the tool. 
The storage panel hides when not being used.

Since all the views are synchronized, moving through the timeline will update all the views to match the actual frame.
![Mutiple views image](https://github.com/Belberus/ThanosDidNothingWrong/blob/develop/images/screenshot1.jpg)

#### Annotations
The tool allows different types of objects; "Persons", "Poses" and "Boxes". Each object has an individual and unique UID for fast identification. Multiple objects can be visualized at the same time.
(TODO: maybe show the process focusing in a single person and show all assigned object types and actions to that UID)

![Poses image](https://github.com/Belberus/ThanosDidNothingWrong/blob/develop/images/screenshot3.jpg)

In the Keypoint editor you can visualize which frames (top row) have annotations for each object (first column). There are also special operations that can be perfomed at an object level and for a range of frames(red buttons):
  1. Batch delete annotations.
  2. Swap the UIDs of two objects.
  3. For Poses, enforce all limbs' length.

![KeypointEditor image](https://github.com/Belberus/ThanosDidNothingWrong/blob/develop/images/screenshot4.png)

Each object can be individually edited for each individual frame: 
  1. Each position of the keypoints can be modified by clicking or dragging.
  2. The length of the limbs can be changed and enforced, so that the involved keypoints always respect that length constraints.
  3. It is possible to delete the whole annotation or each individual keypoint.

In order to speed up the annotation process several operations can be performed:
  1. **Interpolate**: searches the previous closest annotated frame for that object and interpolates all the frames in between.
  2. **Autocomplete**:  searches the previous closest annotated frame and copies its content to all the frames in between. This operation can be performed at an object or tag level.

Saving the annotation interpolates automatically (this option can be disabled in the Options Panel that will be shown later).

![KeypointEditor Editor image](https://github.com/Belberus/ThanosDidNothingWrong/blob/develop/images/screenshot5.jpg)


