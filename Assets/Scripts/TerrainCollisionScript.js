#pragma strict
var m_TerrainLayer:LayerMask;
var m_TerrainInfo : RaycastHit;
var m_OverTerrain : boolean;
function Start () {

}

function Update () {

	var hit:RaycastHit;
	if(Physics.Raycast(transform.position,-Vector3.up,m_TerrainInfo,Mathf.Infinity,m_TerrainLayer))
	{
		m_OverTerrain = true;
	}
	else
	{
		m_OverTerrain = false;
	}

}