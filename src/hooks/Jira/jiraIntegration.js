class JiraIntegration {
    constructor() {
        this.isConnected = false;
        this.userCredentials = null;
        this.baseUrl = null;
    }

    isJiraConnected() {
        const savedCredentials =localStorage.getItem('jira_credentials');
        if (savedCredentials) {
            this.userCredentials= JSON.parse(savedCredentials);
            this.isConnected = true;
            return true;
        }
        return false;
    }

    async connectToJira(domain, email, apiToken){
        try {
            if (!domain || !email || !apiToken){
                throw new Error("All fields are required");
            }
        this.baseUrl = domain.includes('atlassian.net')
        ? `https://${domain}` 
        : `https://${domain}.atlassian.net`;

        const isValid = await this.testConnection(this.baseUrl, email, apiToken);

        if (isValid) {
            this.userCredentials ={
                domain: this.baseUrl,
                email: email,
                apiToken: apiToken,
                connectedAt: new Date().toISOString()
            };

            localStorage.setItem('jira_credentials', JSON.stringify(this.userCredentials))
            this.isConnected = true;

            return{ 
                success: true,
                message: 'Succesfully connected to Jira'
            }; 
        } else {
            throw new Error ('Failed to connect with Jira. Please check your credentials');
        } 
        }catch (error){
            return {
                success: false, 
                message: error.message
            };
        }
    }

    async testConnection(baseUrl, email, apiToken){
        try {
            const auth = btoa(`${email}:${apiToken}`);

            const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
            method: 'GET',
            headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    return response.ok;
    } catch (error) {
      console.error('Jira connection test failed:', error);
      return false;
    }
  }

  async getProjects() {
    if (!this.isConnected || !this.userCredentials){
        throw new Error ('Not connected to Jira');
    }
    try {
        const auth = btoa(`${this.userCredentials.email}:${this.userCredentials.apiToken}`);
      
      const response = await fetch(`${this.userCredentials.domain}/rest/api/3/project`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const projects = await response.json();
        return projects;
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      throw error;
    }
  }


  async createIssue(projectKey, summary, description, issueType = 'Task') {
    if (!this.isConnected || !this.userCredentials) {
      throw new Error('Not connected to Jira');
    }

    try {
      const auth = btoa(`${this.userCredentials.email}:${this.userCredentials.apiToken}`);
      
      const issueData = {
        fields: {
          project: {
            key: projectKey
          },
          summary: summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueType
          }
        }
      };

      const response = await fetch(`${this.userCredentials.domain}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issueData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          issueKey: result.key,
          issueId: result.id,
          url: `${this.userCredentials.domain}/browse/${result.key}`
        };
      } else {
        const error = await response.json();
        throw new Error(error.errorMessages?.[0] || 'Failed to create issue');
      }
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      throw error;
    }
  }


  disconnect() {
    localStorage.removeItem('jira_credentials');
    this.userCredentials = null;
    this.isConnected = false;
    this.baseUrl = null;
    
    return {
      success: true,
      message: 'Disconnected from Jira successfully'
    };
  }

   getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      domain: this.userCredentials?.domain || null,
      email: this.userCredentials?.email || null,
      connectedAt: this.userCredentials?.connectedAt || null
    };
  }
}

const jiraIntegration = new JiraIntegration();
export default jiraIntegration;