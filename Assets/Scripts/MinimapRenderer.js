#pragma strict
var material:Material = null;

function OnRenderObject()
{
	
	if(Camera.current.name.Contains("Minimap"))
	{
		material.SetPass(0);
		Graphics.DrawMeshNow(GetComponent(MeshFilter).mesh, transform.localToWorldMatrix);
	}
	
}

