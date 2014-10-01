#pragma strict
var m_ID:int;				//what is our group member ID?
var m_Group:int;			//which group number are we in?
var m_EdgeExclusions:int[];	//these are the IDs of members in our group that we cannot connect to
var m_Edges : Array = new Array();

var m_Owner:GameObject = null;
var m_NumWorkerBees: int;
var m_MaxWorkerBees:int;

var m_HasWorkerBee : boolean = false;



function Start () {

}

function Update () {

}

function AddEdge(go:GameObject)
{
	if(!HasEdge(go))
		m_Edges.Push(go);
}

function HasEdge(go:GameObject):boolean
{
	var exists:boolean = false;
	for(var edge in m_Edges)
	{
		if(edge == go.GetComponent(PollenNetworkScript).m_ID)
		{
			exists = true;
			break;
		}
	}
	
	return exists;
}

function IsEdgeConnectionAllowed(go:GameObject) :boolean
{
	if(go.GetComponent(PollenNetworkScript) != null)
	{
		if(go.GetComponent(PollenNetworkScript).m_Group != m_Group)
			return false;
		
		var edgeExclusions:int[] = go.GetComponent(PollenNetworkScript).m_EdgeExclusions;
		for(var i:int = 0; i < edgeExclusions.length; i++)
		{
				if(edgeExclusions[i] == m_ID)
					return false;
		}
		
		for(i= 0; i < m_EdgeExclusions.length; i++)
		{
				if(m_EdgeExclusions[i] == go.GetComponent(PollenNetworkScript).m_ID)
					return false;
		}
		return true;
	}
	return false;
}