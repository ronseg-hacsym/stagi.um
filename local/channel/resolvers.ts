// IDs / Search
const data = [
{
  patp: '~ronseg-hacsym',
  title: 'Compute',
  files: [
  {
    source: 'String',
    title: 'String'
  },
  {
    source: 'String',
    title: 'String'
  },
  {
    source: 'String',
    title: 'String'
  }
  ],
  blockCount: 10
},
{
  patp: '~ronseg-hacsym',
  title: 'Compute',
  files: [
  {
    source: 'String',
    title: 'String'
  },
  {
    source: 'String',
    title: 'String'
  },
  {
    source: 'String',
    title: 'String'
  }
  ],
  blockCount: 10
},
]

export const resolvers = {
  // PreviewProfile: preview top from channels profile
  // BlockCount:  block count
  Query: {
    preview: (_: any, { patp }: any) => {
      return data.filter((el) => el.patp == patp)
    }
  },
  // Retrieve: Retrieve Folders
  Channel: {
    view: (patp: string, title: string) => {
      console.log(patp, title)
      return ['Compute', 'Graph', 'Sky']
    }
  }
};

//////// Mutations

// HeaderToChannel: view channel

// AddToChannel: add to channel