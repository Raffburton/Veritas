package com.raffburton.veritas.installpermission

import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class InstallPermissionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VeritasInstallPermission")

    AsyncFunction("canRequestPackageInstalls") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return@AsyncFunction true
      }

      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      context.packageManager.canRequestPackageInstalls()
    }
  }
}
