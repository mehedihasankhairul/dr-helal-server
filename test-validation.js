import Joi from 'joi';

// Copy the validation schema from the middleware
const contentSchema = Joi.object({
  title: Joi.string().min(5).max(500).required(),
  description: Joi.string().max(2000).optional(),
  content_url: Joi.string().uri().required(),
  content_type: Joi.string().valid('youtube', 'facebook', 'article', 'image', 'video').required(),
  thumbnail_url: Joi.string().uri().optional(),
  category: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  is_published: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
  metadata: Joi.object({
    duration: Joi.string().optional(),
    file_size: Joi.number().optional(),
    dimensions: Joi.object({
      width: Joi.number().optional(),
      height: Joi.number().optional()
    }).optional()
  }).optional()
});

// Additional URL validation function
function validatePlatformUrls(content_url, content_type) {
  const errors = [];
  
  if (content_type === 'youtube') {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
    if (!youtubeRegex.test(content_url)) {
      errors.push('Invalid YouTube URL format');
    }
  }
  
  if (content_type === 'facebook') {
    const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\//;
    if (!facebookRegex.test(content_url)) {
      errors.push('Invalid Facebook URL format');
    }
  }
  
  return errors;
}

// Test cases
const testCases = [
  {
    name: "Valid Article Content",
    data: {
      title: "Test Health Article - Valid Format",
      description: "This is a test article about health tips and wellness advice from Dr. Helal.",
      content_type: "article",
      content_url: "https://example.com/health-article",
      thumbnail_url: "https://example.com/thumbnail.jpg",
      category: "health",
      tags: ["health", "wellness", "tips"],
      is_published: false,
      is_featured: false
    }
  },
  {
    name: "Missing Required Fields",
    data: {
      description: "Testing with missing title and content_url"
    }
  },
  {
    name: "Title Too Short", 
    data: {
      title: "Hi",
      content_type: "article",
      content_url: "https://example.com/article"
    }
  },
  {
    name: "Invalid URL Format",
    data: {
      title: "Test with Invalid URL Format",
      description: "Testing invalid URL format",
      content_type: "article",
      content_url: "not-a-valid-url",
      category: "test"
    }
  },
  {
    name: "Invalid Content Type",
    data: {
      title: "Test with Invalid Content Type",
      description: "Testing invalid content type",
      content_type: "invalid_type",
      content_url: "https://example.com/test",
      category: "test"
    }
  },
  {
    name: "YouTube with Wrong URL",
    data: {
      title: "YouTube Video with Wrong URL",
      description: "Testing YouTube content type with non-YouTube URL",
      content_type: "youtube",
      content_url: "https://example.com/video",
      category: "education"
    }
  },
  {
    name: "Valid YouTube Content",
    data: {
      title: "Valid YouTube Health Video",
      description: "Educational video about health from YouTube",
      content_type: "youtube",
      content_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "education"
    }
  },
  {
    name: "Valid Facebook Content",
    data: {
      title: "Valid Facebook Health Post",
      description: "Health awareness post from Facebook",
      content_type: "facebook",
      content_url: "https://www.facebook.com/post/123456",
      category: "social"
    }
  },
  {
    name: "Title Too Long",
    data: {
      title: "A".repeat(501), // 501 characters, exceeds max of 500
      content_type: "article",
      content_url: "https://example.com/article"
    }
  },
  {
    name: "Description Too Long",
    data: {
      title: "Test Article with Long Description",
      description: "A".repeat(2001), // 2001 characters, exceeds max of 2000
      content_type: "article",
      content_url: "https://example.com/article"
    }
  }
];

console.log('🧪 Starting Content Validation Tests');
console.log('=' .repeat(50));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('📤 Input data:', JSON.stringify(testCase.data, null, 2));
  
  // Validate with Joi schema
  const { error } = contentSchema.validate(testCase.data);
  
  if (error) {
    console.log('❌ Joi Validation Errors:');
    error.details.forEach((detail, i) => {
      console.log(`   ${i + 1}. ${detail.message}`);
    });
  } else {
    console.log('✅ Joi validation passed');
    
    // Check platform-specific URL validation
    if (testCase.data.content_url && testCase.data.content_type) {
      const urlErrors = validatePlatformUrls(testCase.data.content_url, testCase.data.content_type);
      if (urlErrors.length > 0) {
        console.log('❌ Platform URL Validation Errors:');
        urlErrors.forEach((urlError, i) => {
          console.log(`   ${i + 1}. ${urlError}`);
        });
      } else {
        console.log('✅ Platform URL validation passed');
      }
    }
  }
  
  console.log('-'.repeat(30));
});

console.log('\n✨ Validation tests completed!');
console.log('\n🔍 Summary of validation requirements:');
console.log('Required fields: title (5-500 chars), content_url (valid URI), content_type');
console.log('Valid content_types: youtube, facebook, article, image, video');
console.log('Optional fields: description (max 2000), thumbnail_url, category, tags, etc.');
console.log('Platform URLs: YouTube URLs must match YouTube format, Facebook URLs must match Facebook format');
