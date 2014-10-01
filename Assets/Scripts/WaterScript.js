#pragma strict

var m_OrigPosition:Vector3;
function Start () {
m_OrigPosition = transform.position;
}

function Update () {
transform.position.y = m_OrigPosition.y + Mathf.Sin(Time.time) *2;

var amt = Time.deltaTime;
renderer.material.mainTextureOffset.y -= amt*0.02;
var offset = renderer.material.GetTextureOffset ("_BumpMap");
renderer.material.SetTextureOffset ("_BumpMap", Vector2(0,offset.y+amt*0.02));
}

function OnTriggerEnter(coll : Collider)
{
	if(Network.isServer)
	{
		
		if(coll.gameObject.tag == "Player")
		{
			
			//coll.gameObject.AddComponent(DrowningDecorator);		
			//coll.gameObject.transform.position -= 
	
		}
	}
}