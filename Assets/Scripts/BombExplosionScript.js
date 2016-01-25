#pragma strict
var m_Owner : GameObject = null;;
function Start () {
		
		var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
		for(var i:int = 0; i < players.length; i++)
		{
			if(players[i] != null &&  players[i].GetComponent(BeeScript).m_Camera != null && players[i].GetComponent(RespawnDecorator) == null)
			{
				var cam:GameObject = players[i].GetComponent(BeeScript).m_Camera;
				if(cam != null)
				{
					if((cam.transform.position - transform.position).magnitude < 1000)
					{
						cam.GetComponent(CameraScript).Shake(0.33,4.5);
					}
				}
			}
		}
}

function Update () {

}