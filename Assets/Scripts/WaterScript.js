#pragma strict

function Start () {

}

function Update () {
renderer.material.mainTextureOffset.x += Time.deltaTime*0.1;
}

function OnTriggerEnter(coll : Collider)
{
	if(Network.isServer)
	{
		
		if(coll.gameObject.tag == "Player")
		{
			var offset:Vector3 = (coll.gameObject.transform.position -  transform.position).normalized*coll.gameObject.transform.localScale.magnitude*4 ;
			ServerRPC.Buffer(coll.gameObject.networkView, "Drown", RPCMode.All,offset);
			//coll.gameObject.AddComponent(DrowningDecorator);		
			//coll.gameObject.transform.position -= 
	
		}
	}
}