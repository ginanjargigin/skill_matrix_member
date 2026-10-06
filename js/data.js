window.AppData={
  data:null,

  async load(){
    const saved=localStorage.getItem("mpr_data");

    if(saved){
      try{
        this.data=JSON.parse(saved);
      }catch(error){
        localStorage.removeItem("mpr_data");
      }
    }

    if(!this.data){
      const response=await fetch("data/seed.json");
      this.data=await response.json();
    }

    this.data.lines=this.data.lines||[];
    this.data.members=this.data.members||[];
    this.data.operations=this.data.operations||{};
    this.data.assignments=this.data.assignments||[];

    this.data.lines.forEach(line=>{
      if(!this.data.operations[line.id]) this.data.operations[line.id]=[];
      if(line.standardMembers==null) line.standardMembers=0;
    });

    this.data.members.forEach(member=>{
      if(!member.skills) member.skills={};
      if(!member.availability) member.availability="available";
      if(!member.photoUrl) member.photoUrl="";
    });

    return this.data;
  }
};