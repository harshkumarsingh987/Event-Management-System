import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
});

const Event = mongoose.model('Event', EventSchema);

export default Event;  // Use export default with ES modules

