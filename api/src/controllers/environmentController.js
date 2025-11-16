import Environment from '../models/Environment.js';

// @desc    Get all environments for user
// @route   GET /api/environments
// @access  Private
export const getEnvironments = async (req, res) => {
  try {
    const environments = await Environment.find({ owner: req.user.id });

    res.status(200).json({
      success: true,
      count: environments.length,
      environments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single environment
// @route   GET /api/environments/:id
// @access  Private
export const getEnvironment = async (req, res) => {
  try {
    const environment = await Environment.findById(req.params.id);

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    // Check ownership
    if (environment.owner.toString() !== req.user.id && !environment.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this environment',
      });
    }

    res.status(200).json({
      success: true,
      environment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new environment
// @route   POST /api/environments
// @access  Private
export const createEnvironment = async (req, res) => {
  try {
    const { name, stack } = req.body;

    // Check plan limits
    const userEnvironments = await Environment.countDocuments({ owner: req.user.id });

    const limits = {
      free: 3,
      pro: Infinity,
      enterprise: Infinity,
    };

    if (userEnvironments >= limits[req.user.plan]) {
      return res.status(403).json({
        success: false,
        message: `Your ${req.user.plan} plan only allows ${limits[req.user.plan]} environments. Please upgrade.`,
      });
    }

    const environment = await Environment.create({
      name,
      stack,
      owner: req.user.id,
      status: 'provisioning',
    });

    // Simulate environment provisioning (in real app, this would trigger actual provisioning)
    setTimeout(async () => {
      environment.status = 'running';
      environment.services = getServicesForStack(stack);
      await environment.save();
    }, 2000);

    res.status(201).json({
      success: true,
      environment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update environment
// @route   PUT /api/environments/:id
// @access  Private
export const updateEnvironment = async (req, res) => {
  try {
    let environment = await Environment.findById(req.params.id);

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    // Check ownership
    if (environment.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this environment',
      });
    }

    environment = await Environment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      environment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete environment
// @route   DELETE /api/environments/:id
// @access  Private
export const deleteEnvironment = async (req, res) => {
  try {
    const environment = await Environment.findById(req.params.id);

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    // Check ownership
    if (environment.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this environment',
      });
    }

    await environment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Environment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to get services based on stack
const getServicesForStack = (stack) => {
  const stackServices = {
    'node-postgres': [
      { name: 'Node.js', type: 'runtime', port: 3000, url: 'http://localhost:3000', status: 'running' },
      { name: 'PostgreSQL', type: 'database', port: 5432, url: 'postgresql://localhost:5432', status: 'running' },
    ],
    'python-redis': [
      { name: 'Python', type: 'runtime', port: 8000, url: 'http://localhost:8000', status: 'running' },
      { name: 'Redis', type: 'cache', port: 6379, url: 'redis://localhost:6379', status: 'running' },
    ],
    'go-postgres': [
      { name: 'Go', type: 'runtime', port: 8080, url: 'http://localhost:8080', status: 'running' },
      { name: 'PostgreSQL', type: 'database', port: 5432, url: 'postgresql://localhost:5432', status: 'running' },
    ],
  };

  return stackServices[stack] || [];
};
