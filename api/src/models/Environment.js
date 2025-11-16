import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
      required: true,
      enum: ['node-postgres', 'python-redis', 'go-postgres', 'rust-mysql', 'java-kafka', 'dotnet-sql'],
    },
    status: {
      type: String,
      enum: ['running', 'stopped', 'error', 'provisioning'],
      default: 'stopped',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    services: [
      {
        name: String,
        type: String, // postgres, redis, kafka, etc.
        port: Number,
        url: String,
        status: String,
      },
    ],
    configuration: {
      nodeVersion: String,
      pythonVersion: String,
      databases: [String],
      ports: [Number],
    },
    snapshot: {
      id: String,
      createdAt: Date,
      size: Number,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareUrl: String,
  },
  {
    timestamps: true,
  }
);

const Environment = mongoose.model('Environment', environmentSchema);

export default Environment;
